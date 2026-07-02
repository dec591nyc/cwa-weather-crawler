# Development Plan

## Phase 1: SQLite Crawler MVP

Implement CWA fetch, raw snapshot storage, normalization, SQLite persistence, and CLI scripts.

## Phase 2: FastAPI Data Service

Expose latest forecasts, station list, counties, history, GeoJSON, and health check endpoints.

## Phase 3: Windy + Leaflet Frontend

Initialize Windy once, render CWA data through Leaflet overlays, and add legend/filter controls.

## Phase 4: Data Platform Upgrade

Move from SQLite to PostgreSQL/PostGIS when historical data and spatial queries grow.
