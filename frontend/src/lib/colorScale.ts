export function colorByTemperature(temp: number | null): string {
  if (temp === null) return "#718096"; // Cool grey for null
  if (temp < 10) return "#2b6cb0";     // Dark Blue (Cold)
  if (temp < 15) return "#3182ce";     // Blue (Cool)
  if (temp < 20) return "#38a169";     // Green (Mild)
  if (temp < 25) return "#ecc94b";     // Yellow (Comfortable)
  if (temp < 30) return "#ed8936";     // Orange (Warm)
  if (temp < 35) return "#e53e3e";     // Red (Hot)
  return "#9b2c2c";                    // Dark Red (Very Hot)
}

export function getRadiusByTemperature(temp: number | null): number {
  if (temp === null) return 8;
  if (temp < 10 || temp >= 35) return 12;
  if (temp < 15 || temp >= 30) return 10;
  return 8;
}

export const legendItems = [
  { label: "< 10°C", color: "#2b6cb0", desc: "寒冷" },
  { label: "10–15°C", color: "#3182ce", desc: "涼爽" },
  { label: "15–20°C", color: "#38a169", desc: "溫和" },
  { label: "20–25°C", color: "#ecc94b", desc: "舒適" },
  { label: "25–30°C", color: "#ed8936", desc: "溫暖" },
  { label: "30–35°C", color: "#e53e3e", desc: "炎熱" },
  { label: "≥ 35°C", color: "#9b2c2c", desc: "酷熱" },
];
