import React from "react";
import { legendItems } from "../lib/colorScale.ts";

export const Legend: React.FC = () => {
  return (
    <div className="legend-card">
      <div className="legend-title">溫度級距</div>
      {legendItems.map((item) => (
        <div className="legend-row" key={item.label}>
          <div
            className="legend-color-box"
            style={{ backgroundColor: item.color }}
          />
          <span className="legend-label">{item.label}</span>
          <span className="legend-desc">{item.desc}</span>
        </div>
      ))}
    </div>
  );
};
