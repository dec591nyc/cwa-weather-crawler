from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

INVALID_VALUES = {"", "X", "NA", "null", "None", "-99", "-999", None}


def parse_float(value: Any) -> float | None:
    if value in INVALID_VALUES:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def extract_element_value(values: list[dict[str, Any]]) -> dict[str, str]:
    """Helper to extract values from ElementValue list of dicts."""
    if not values or not isinstance(values, list):
        return {}
    item = values[0]
    if not isinstance(item, dict):
        return {}
    return {k.lower(): str(v) for k, v in item.items() if v is not None}


def normalize_f_d0047_091(raw_data: dict[str, Any], dataset_id: str) -> list[dict[str, Any]]:
    """Normalize CWA township weekly forecast dataset F-D0047-091.

    The CWA structure is nested by locations and weather elements. This flattens
    each location/time period into one record.
    """
    records: list[dict[str, Any]] = []
    fetched_at = now_iso()
    locations = raw_data.get("records", {}).get("Locations", raw_data.get("records", {}).get("locations", []))

    for location_group in locations:
        group_name = location_group.get("LocationsName") or location_group.get("locationsName")
        for location in location_group.get("Location", location_group.get("location", [])):
            county = location.get("LocationName") or location.get("locationName") or group_name
            geocode = location.get("Geocode") or location.get("geocode")
            lat = parse_float(location.get("Latitude") or location.get("latitude") or location.get("lat"))
            lon = parse_float(location.get("Longitude") or location.get("longitude") or location.get("lon"))

            # The dataset may use county-level or township-level location nodes.
            weather_elements = location.get("WeatherElement", location.get("weatherElement", []))
            by_time: dict[tuple[str, str | None], dict[str, Any]] = {}

            for element in weather_elements:
                element_name = element.get("ElementName") or element.get("elementName")
                times = element.get("Time", element.get("time", []))
                for time_obj in times:
                    start_time = time_obj.get("StartTime") or time_obj.get("startTime") or time_obj.get("dataTime") or time_obj.get("DataTime")
                    end_time = time_obj.get("EndTime") or time_obj.get("endTime")
                    if not start_time:
                        continue
                    key = (start_time, end_time)
                    row = by_time.setdefault(
                        key,
                        {
                            "station_id": geocode,
                            "station_name": county,
                            "county": county,
                            "town": None,
                            "lat": lat,
                            "lon": lon,
                            "forecast_start": start_time,
                            "forecast_end": end_time,
                            "weather": None,
                            "weather_code": None,
                            "min_temp": None,
                            "max_temp": None,
                            "temperature": None,
                            "humidity": None,
                            "pop": None,
                            "wind_speed": None,
                            "wind_direction": None,
                            "source_dataset": dataset_id,
                            "fetched_at": fetched_at,
                        },
                    )

                    values = time_obj.get("ElementValue", time_obj.get("elementValue", []))
                    val_dict = extract_element_value(values)

                    if element_name in {"Wx", "天氣現象"}:
                        row["weather"] = val_dict.get("weather")
                        row["weather_code"] = val_dict.get("weathercode")
                    elif element_name in {"MinT", "最低溫度", "MinTemperature"}:
                        row["min_temp"] = parse_float(val_dict.get("mintemperature") or val_dict.get("value"))
                    elif element_name in {"MaxT", "最高溫度", "MaxTemperature"}:
                        row["max_temp"] = parse_float(val_dict.get("maxtemperature") or val_dict.get("value"))
                    elif element_name in {"T", "溫度", "Temperature", "平均溫度"}:
                        row["temperature"] = parse_float(val_dict.get("temperature") or val_dict.get("value"))
                    elif element_name in {"RH", "相對濕度", "RelativeHumidity", "平均相對濕度"}:
                        row["humidity"] = parse_float(val_dict.get("relativehumidity") or val_dict.get("value"))
                    elif element_name in {"PoP", "12小時降雨機率", "降雨機率", "ProbabilityOfPrecipitation"}:
                        row["pop"] = parse_float(val_dict.get("probabilityofprecipitation") or val_dict.get("value"))
                    elif element_name in {"WS", "風速", "WindSpeed"}:
                        row["wind_speed"] = parse_float(val_dict.get("windspeed") or val_dict.get("value"))
                    elif element_name in {"WD", "風向", "WindDirection"}:
                        row["wind_direction"] = val_dict.get("winddirection") or val_dict.get("value")

            for row in by_time.values():
                if row["weather"] or row["min_temp"] is not None or row["max_temp"] is not None:
                    records.append(row)

    return records
