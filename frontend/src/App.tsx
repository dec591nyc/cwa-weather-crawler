import React, { useState, useEffect } from "react";
import { LayerControl } from "./components/LayerControl.tsx";
import { MapLibreMap } from "./components/MapLibreMap.tsx";
import { Legend } from "./components/Legend.tsx";
import { GeoJsonFeature, GeoJsonCollection, HealthResponse } from "./types/weather.ts";

export const App: React.FC = () => {
  const [features, setFeatures] = useState<GeoJsonFeature[]>([]);
  const [counties, setCounties] = useState<string[]>([]);
  
  // Controls state
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [minTemp, setMinTemp] = useState<number>(0);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [activeWeatherLayer, setActiveWeatherLayer] = useState<string>("radar");

  // System status state
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch counties
      const countiesRes = await fetch("/api/counties");
      if (!countiesRes.ok) throw new Error("Failed to load counties");
      const countiesData = await countiesRes.json();
      setCounties(countiesData.counties || []);

      // Fetch CWA weather geojson
      const geojsonRes = await fetch("/api/temperature/geojson");
      if (!geojsonRes.ok) throw new Error("Failed to load CWA temperature observations");
      const geojsonData: GeoJsonCollection = await geojsonRes.json();
      setFeatures(geojsonData.features || []);

      // Fetch latest update status
      const healthRes = await fetch("/api/health");
      if (healthRes.ok) {
        const healthData: HealthResponse = await healthRes.json();
        if (healthData.latest_fetch) {
          setLastUpdate(healthData.latest_fetch.fetched_at);
          setRecordCount(healthData.latest_fetch.record_count);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle manual data refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (!res.ok) {
        throw new Error("CWA Sync failed. Backend server error.");
      }
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to sync data with CWA OpenData.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="header-bar">
        <div className="header-title-container">
          <span className="header-logo">🌦️</span>
          <div>
            <h1 className="header-title">台灣中央氣象署氣溫觀測與預報</h1>
            <p className="header-subtitle">MapLibre GL 向量底圖 + 氣象署測站即時溫度疊加層</p>
          </div>
        </div>
        <div className="header-status">
          <span className={`status-dot ${error ? "stale" : ""}`} />
          <span>{error ? "API 連線中斷" : "系統連線正常"}</span>
        </div>
      </header>

      {/* Main App Layout */}
      <main className="app-container">
        <LayerControl
          counties={counties}
          selectedCounty={selectedCounty}
          onCountyChange={setSelectedCounty}
          minTemp={minTemp}
          onMinTempChange={setMinTemp}
          showLabels={showLabels}
          onShowLabelsToggle={() => setShowLabels(!showLabels)}
          activeWeatherLayer={activeWeatherLayer}
          onWeatherLayerChange={setActiveWeatherLayer}
          lastUpdate={lastUpdate}
          recordCount={recordCount}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        <div style={{ position: "relative", flex: 1, height: "100%" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", backgroundColor: "var(--bg-primary)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <div style={{ color: "var(--text-secondary)", fontWeight: 500 }}>正在載入 MapLibre 地圖與中央氣象署觀測資料...</div>
              </div>
            </div>
          ) : (
            <>
              <MapLibreMap
                features={features}
                selectedCounty={selectedCounty}
                minTemp={minTemp}
                showLabels={showLabels}
                activeWeatherLayer={activeWeatherLayer}
              />
              <Legend />
            </>
          )}
        </div>
      </main>
    </>
  );
};
export default App;
