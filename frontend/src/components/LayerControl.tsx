import React from "react";

interface LayerControlProps {
  counties: string[];
  selectedCounty: string;
  onCountyChange: (county: string) => void;
  
  minTemp: number;
  onMinTempChange: (temp: number) => void;
  
  showLabels: boolean;
  onShowLabelsToggle: () => void;
  
  activeWeatherLayer: string;
  onWeatherLayerChange: (layer: string) => void;
  
  lastUpdate: string | null;
  recordCount: number | null;
  onRefresh: () => void;
  refreshing: boolean;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  counties,
  selectedCounty,
  onCountyChange,
  minTemp,
  onMinTempChange,
  showLabels,
  onShowLabelsToggle,
  activeWeatherLayer,
  onWeatherLayerChange,
  lastUpdate,
  recordCount,
  onRefresh,
  refreshing,
}) => {
  const weatherLayers = [
    { id: "none", name: "純地圖底圖", icon: "🗺️" },
    { id: "radar", name: "降雨雷達圖", icon: "🌧️" },
    { id: "satellite", name: "紅外線衛星雲圖", icon: "📡" },
  ];

  return (
    <aside className="sidebar">
      {/* Title */}
      <div className="sidebar-section">
        <h2 className="sidebar-section-title">台灣氣象觀測控制面板</h2>
      </div>

      {/* County Filter */}
      <div className="sidebar-section">
        <label className="sidebar-section-title" htmlFor="county-select">縣市篩選</label>
        <select
          id="county-select"
          className="form-select"
          value={selectedCounty}
          onChange={(e) => onCountyChange(e.target.value)}
        >
          <option value="">全台灣各縣市</option>
          {counties.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Temperature Filter */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">氣溫篩選</div>
        <div className="range-slider-container">
          <div className="slider-labels">
            <span>顯示氣溫 ≥ {minTemp}°C</span>
            <span>40°C</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={minTemp}
            onChange={(e) => onMinTempChange(Number(e.target.value))}
            className="range-slider"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="sidebar-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={onShowLabelsToggle}
            className="checkbox-input"
          />
          顯示測站溫度標籤
        </label>
      </div>

      {/* Background Layers */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">天氣圖層疊加</div>
        <div className="layer-grid">
          {weatherLayers.map((layer) => (
            <button
              key={layer.id}
              className={`layer-btn ${activeWeatherLayer === layer.id ? "active" : ""}`}
              onClick={() => onWeatherLayerChange(layer.id)}
            >
              <span className="layer-icon">{layer.icon}</span>
              <span>{layer.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Data Stats & Refresh */}
      <div className="sidebar-section" style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
        <div className="sidebar-section-title">觀測資料資訊</div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.8rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <div><strong>測站總數:</strong> {recordCount ?? "-"}</div>
          {lastUpdate && (
            <div>
              <strong>最後更新時間:</strong> {new Date(lastUpdate).toLocaleString()}
            </div>
          )}
        </div>
        <button
          className={`refresh-btn ${refreshing ? "loading" : ""}`}
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              正在同步氣象局資料...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              同步最新觀測資料
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
