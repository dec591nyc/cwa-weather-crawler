import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { GeoJsonFeature } from "../types/weather.ts";

interface MapLibreMapProps {
  features: GeoJsonFeature[];
  selectedCounty: string;
  minTemp: number;
  showLabels: boolean;
  activeWeatherLayer: string;
}

export const MapLibreMap: React.FC<MapLibreMapProps> = ({
  features,
  selectedCounty,
  minTemp,
  showLabels,
  activeWeatherLayer,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // RainViewer paths (API provides hash paths)
  const [radarPath, setRadarPath] = useState<string | null>(null);
  const [satellitePath, setSatellitePath] = useState<string | null>(null);

  // Load RainViewer public map metadata (non-API-key endpoint)
  useEffect(() => {
    const fetchTimestamps = async () => {
      try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        if (res.ok) {
          const data = await res.json();
          
          // Get latest radar path
          if (data.radar && data.radar.past && data.radar.past.length > 0) {
            setRadarPath(data.radar.past[data.radar.past.length - 1].path);
          }
          
          // Get latest satellite path
          if (data.satellite && data.satellite.infrared && data.satellite.infrared.length > 0) {
            setSatellitePath(data.satellite.infrared[data.satellite.infrared.length - 1].path);
          } else {
            // Fallback: RainViewer sometimes has empty infrared list. Try visible or standard path
            if (data.satellite && data.satellite.visible && data.satellite.visible.length > 0) {
              setSatellitePath(data.satellite.visible[data.satellite.visible.length - 1].path);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch RainViewer maps metadata", err);
      }
    };
    fetchTimestamps();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use CartoDB Positron light vector basemap
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [121.0, 23.7],
      zoom: 7.2,
    });

    mapRef.current = map;

    // Load CWA layers when style loads
    map.on("load", () => {
      // Add CWA GeoJSON source
      map.addSource("cwa-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Add CWA circles layer (acts as badge background or simple dot)
      map.addLayer({
        id: "cwa-circles",
        type: "circle",
        source: "cwa-source",
        paint: {
          "circle-radius": showLabels ? 13 : 6,
          "circle-color": [
            "step",
            ["get", "temperature"],
            "#2b6cb0",
            10, "#3182ce",
            15, "#38a169",
            20, "#ecc94b",
            25, "#ed8936",
            30, "#e53e3e",
            35, "#9b2c2c",
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });

      // Add CWA text labels layer - centered inside the circle badges
      map.addLayer({
        id: "cwa-labels",
        type: "symbol",
        source: "cwa-source",
        layout: {
          "text-field": ["concat", ["to-string", ["round", ["get", "temperature"]]], "°"],
          "text-size": 9.5,
          "text-offset": [0, 0],
          "text-anchor": "center",
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": [
            "step",
            ["get", "temperature"],
            "#ffffff", // < 10
            10, "#ffffff", // 10-15
            15, "#ffffff", // 15-20
            20, "#0f172a", // 20-25 (Yellow background gets dark text!)
            25, "#ffffff", // 25-30
            30, "#ffffff", // 30-35
            35, "#ffffff", // >= 35
          ],
        },
      });

      // Show/hide labels and set circle sizes based on initial toggle state
      map.setLayoutProperty("cwa-labels", "visibility", showLabels ? "visible" : "none");
      map.setPaintProperty("cwa-circles", "circle-radius", showLabels ? 13 : 6);

      // Popup handler on click
      map.on("click", "cwa-circles", (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const coordinates = (feature.geometry as any).coordinates.slice();
        const props = feature.properties;

        // Extract values
        const name = props.station_name;
        const county = props.county || "";
        const town = props.town || "";
        const temp = props.temperature !== undefined && props.temperature !== "null" ? Number(props.temperature) : null;
        const pop = props.pop !== undefined && props.pop !== "null" ? Number(props.pop) : null;
        const humidity = props.humidity !== undefined && props.humidity !== "null" ? Number(props.humidity) : null;
        const windSpeed = props.wind_speed !== undefined && props.wind_speed !== "null" ? Number(props.wind_speed) : null;
        const windDirection = props.wind_direction || "-";
        const fetchedAt = props.fetched_at;

        const popupHtml = `
          <div class="popup-container">
            <div class="popup-header">
              <div class="popup-station-name">${name}</div>
              <div class="popup-location-sub">${county} ${town}</div>
            </div>
            <div class="popup-temp-large">${temp !== null ? `${temp}°C` : "無資料"}</div>
            <div class="popup-grid">
              <span class="popup-label">降雨機率:</span>
              <span class="popup-value">${pop !== null ? `${pop}%` : "-"}</span>
              <span class="popup-label">相對濕度:</span>
              <span class="popup-value">${humidity !== null ? `${humidity}%` : "-"}</span>
              <span class="popup-label">風速:</span>
              <span class="popup-value">${windSpeed !== null ? `${windSpeed} m/s` : "-"}</span>
              <span class="popup-label">風向:</span>
              <span class="popup-value">${windDirection}</span>
            </div>
            <div class="popup-time">氣象局觀測時間: ${new Date(fetchedAt).toLocaleTimeString()}</div>
          </div>
        `;

        new maplibregl.Popup({ className: "custom-mapbox-popup" })
          .setLngLat(coordinates)
          .setHTML(popupHtml)
          .addTo(map);
      });

      // Change cursor style on hover
      map.on("mouseenter", "cwa-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "cwa-circles", () => {
        map.getCanvas().style.cursor = "";
      });

      // Trigger initial layers load
      updateCwaData();
      updateWeatherLayer();
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update CWA data source when filters/features change
  useEffect(() => {
    updateCwaData();
  }, [features, selectedCounty, minTemp]);

  // Update CWA labels visibility and circle sizes
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      if (map.getLayer("cwa-labels")) {
        map.setLayoutProperty("cwa-labels", "visibility", showLabels ? "visible" : "none");
      }
      if (map.getLayer("cwa-circles")) {
        map.setPaintProperty("cwa-circles", "circle-radius", showLabels ? 13 : 6);
      }
    }
  }, [showLabels]);

  // Update weather base overlay layer when activeWeatherLayer or paths change
  useEffect(() => {
    updateWeatherLayer();
  }, [activeWeatherLayer, radarPath, satellitePath]);

  const updateCwaData = () => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("cwa-source") as maplibregl.GeoJSONSource;
    if (!source) {
      console.warn("CWA source 'cwa-source' not found on map yet.");
      return;
    }

    // Filter features
    const filteredFeatures = features.filter((feat) => {
      const props = feat.properties;

      // Filter by county
      if (selectedCounty && props.county !== selectedCounty) {
        return false;
      }

      // Filter by min temperature
      if (props.temperature !== null && props.temperature < minTemp) {
        return false;
      }

      return true;
    });

    console.log("Setting CWA data features count:", filteredFeatures.length);

    source.setData({
      type: "FeatureCollection",
      features: filteredFeatures,
    });
  };

  const updateWeatherLayer = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Remove existing weather source & layer
    if (map.getLayer("weather-layer")) {
      map.removeLayer("weather-layer");
    }
    if (map.getSource("weather-source")) {
      map.removeSource("weather-source");
    }

    let tileUrl = "";

    // Build URL using RainViewer hash-based path structure
    if (activeWeatherLayer === "radar" && radarPath) {
      tileUrl = `https://tilecache.rainviewer.com${radarPath}/256/{z}/{x}/{y}/2/1_1.png`;
    } else if (activeWeatherLayer === "satellite" && satellitePath) {
      tileUrl = `https://tilecache.rainviewer.com${satellitePath}/256/{z}/{x}/{y}/2/1_1.png`;
    }

    if (tileUrl) {
      map.addSource("weather-source", {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        maxzoom: 8, // Set maxzoom to 8 for correct tile stretching on zoom
      });

      // Insert weather layer BEFORE CWA circle layer so stations draw on top of the radar!
      const beforeId = map.getLayer("cwa-circles") ? "cwa-circles" : undefined;
      map.addLayer(
        {
          id: "weather-layer",
          type: "raster",
          source: "weather-source",
          paint: {
            "raster-opacity": 0.5,
          },
        },
        beforeId
      );
    }
  };

  return (
    <div className="map-pane">
      <div ref={mapContainerRef} id="map" />
    </div>
  );
};
