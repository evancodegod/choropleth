# Canada Choropleth Split: Frontend / Backend / Database

## Folder Structure

```text
choropleth map data/
  frontend/
    index.html
    app.js
  backend/
    package.json
    openapi.yaml
    src/
      server.js
      constants.js
  database/
    schema.sql
```

## Responsibilities

- Frontend:
  - Renders Leaflet map and UI controls.
  - Calls backend APIs for filter options and choropleth values.
  - Does not parse CSV directly.
- Backend:
  - Serves API endpoints.
  - Applies aggregation rules (single facility, grouped facility, all facilities, weighted score).
  - Loads CSV data into SQLite and reads API results from the database.
- Database:
  - Stores normalized facts and dimensions.
  - Supports fast aggregation queries for map responses.

## API Contract (High Level)

- `GET /api/health`
  - Returns service health.
- `GET /api/filters`
  - Returns `conditions` and `facilities` (including grouped/all options).
- `GET /api/choropleth?facility=__all_facilities__&condition=weighted_score`
  - Returns province values for the selected filters.
  - `condition` accepts normal conditions (`Good`, `Fair`, etc.) or `weighted_score`.

## Architecture Diagram (As-Is)

```mermaid
flowchart LR
  U[User Browser]

  subgraph FE[Frontend]
    FE_HTML[index.html]
    FE_JS[app.js\nLeaflet map + UI controls]
  end

  subgraph BE[Backend API]
    API[Express server\nserver.js]
    RULES[Aggregation rules\nconstants.js]
    CSVLOAD[CSV loader at startup\npapaparse + fs]
    DBINIT[SQLite init + schema apply]
    EP1[/GET /api/filters/]
    EP2[/GET /api/choropleth/]
    EP3[/GET /api/health/]
  end

  subgraph DB[Database]
    SCH[schema.sql]
    T1[(provinces)]
    T2[(facilities)]
    T3[(facility_groups)]
    T4[(facility_group_members)]
    T5[(conditions)]
    T6[(conditionMetrics)]
  end

  CSV[Province CSV files]

  GEO[(Canada GeoJSON source)]

  U --> FE_HTML --> FE_JS
  FE_JS --> EP1
  FE_JS --> EP2
  FE_JS --> GEO

  EP1 --> API
  EP2 --> API
  EP3 --> API
  API --> RULES
  CSV --> CSVLOAD --> DBINIT
  DBINIT --> T1
  DBINIT --> T2
  DBINIT --> T3
  DBINIT --> T4
  DBINIT --> T5
  DBINIT --> T6
  API --> T1
  API --> T2
  API --> T3
  API --> T4
  API --> T5
  API --> T6

  SCH -. defines tables .-> T1
  SCH -. defines tables .-> T2
  SCH -. defines tables .-> T3
  SCH -. defines tables .-> T4
  SCH -. defines tables .-> T5
  SCH -. defines tables .-> T6
```

## Migration Notes

- Keep existing root `index.html` as legacy/reference.
- Move production UI to `frontend/`.
- Backend now loads CSVs into SQLite on startup and serves queries from DB tables.
