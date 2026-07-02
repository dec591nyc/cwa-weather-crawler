from __future__ import annotations

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from database.connection import get_connection

app = FastAPI(title="CWA Weather Data Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    with get_connection() as conn:
        latest = conn.execute(
            "SELECT fetched_at, status, record_count FROM fetch_logs ORDER BY id DESC LIMIT 1"
        ).fetchone()
    return {
        "status": "ok",
        "latest_fetch": dict(latest) if latest else None,
    }


@app.post("/api/refresh")
def refresh_data():
    try:
        from crawler.service import run_crawler
        count = run_crawler()
        return {"status": "ok", "record_count": count}
    except Exception as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/counties")
def counties():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT DISTINCT county FROM forecasts WHERE county IS NOT NULL ORDER BY county"
        ).fetchall()
    return {"counties": [row["county"] for row in rows]}


@app.get("/api/stations")
def stations(county: str | None = None):
    sql = "SELECT * FROM stations"
    params: list[str] = []
    if county:
        sql += " WHERE county = ?"
        params.append(county)
    sql += " ORDER BY county, station_name"
    with get_connection() as conn:
        rows = conn.execute(sql, params).fetchall()
    return {"count": len(rows), "stations": [dict(row) for row in rows]}


@app.get("/api/forecast/latest")
def latest_forecast(
    county: str | None = None,
    limit: int = Query(100, ge=1, le=1000),
):
    sql = """
        SELECT * FROM forecasts
        WHERE fetched_at = (SELECT MAX(fetched_at) FROM forecasts)
    """
    params: list[object] = []
    if county:
        sql += " AND county = ?"
        params.append(county)
    sql += " ORDER BY county, forecast_start LIMIT ?"
    params.append(limit)
    with get_connection() as conn:
        rows = conn.execute(sql, params).fetchall()
    return {"count": len(rows), "forecasts": [dict(row) for row in rows]}


@app.get("/api/forecast/history")
def forecast_history(
    county: str | None = None,
    limit: int = Query(500, ge=1, le=5000),
):
    sql = "SELECT * FROM forecasts WHERE 1=1"
    params: list[object] = []
    if county:
        sql += " AND county = ?"
        params.append(county)
    sql += " ORDER BY fetched_at DESC, forecast_start ASC LIMIT ?"
    params.append(limit)
    with get_connection() as conn:
        rows = conn.execute(sql, params).fetchall()
    return {"count": len(rows), "forecasts": [dict(row) for row in rows]}


@app.get("/api/temperature/geojson")
def temperature_geojson(county: str | None = None):
    sql = """
        SELECT s.lon, s.lat, s.station_name, f.*
        FROM (
            SELECT *, ROW_NUMBER() OVER(PARTITION BY station_id ORDER BY forecast_start ASC) as rn
            FROM forecasts
            WHERE fetched_at = (SELECT MAX(fetched_at) FROM forecasts)
        ) f
        LEFT JOIN stations s ON s.station_id = f.station_id
        WHERE f.rn = 1 AND s.lat IS NOT NULL AND s.lon IS NOT NULL
    """
    params: list[object] = []
    if county:
        sql += " AND f.county = ?"
        params.append(county)

    with get_connection() as conn:
        rows = conn.execute(sql, params).fetchall()

    features = []
    for row in rows:
        data = dict(row)
        lon = data.pop("lon")
        lat = data.pop("lat")
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": data,
        })
    return {"type": "FeatureCollection", "features": features}
