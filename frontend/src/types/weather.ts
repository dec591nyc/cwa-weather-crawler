export interface ForecastProperties {
  id: number;
  station_id: string;
  station_name: string;
  county: string;
  town: string | null;
  forecast_start: string;
  forecast_end: string;
  weather: string | null;
  weather_code: string | null;
  min_temp: number | null;
  max_temp: number | null;
  temperature: number | null;
  humidity: number | null;
  pop: number | null;
  wind_speed: number | null;
  wind_direction: string | null;
  source_dataset: string;
  fetched_at: string;
}

export interface GeoJsonFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  properties: ForecastProperties;
}

export interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface HealthResponse {
  status: string;
  latest_fetch: {
    fetched_at: string;
    status: string;
    record_count: number;
  } | null;
}
