# Split Starter (Frontend / Backend / Database)

This scaffold keeps your current root `index.html` intact and adds a split architecture starter.

## Run Backend

```powershell
cd backend
npm install
npm run dev
```

Backend starts on `http://localhost:3000`.

## Run Frontend

From project root:

```powershell
cd frontend
python -m http.server 8080
```

Open `http://localhost:8080`.

## Current State

- API contract exists in `backend/openapi.yaml`.
- Database schema exists in `database/schema.sql`.
- Backend initializes a local SQLite database at startup and loads CSV data into `conditionMetrics`.
- Frontend is fully wired to API endpoints.

## Next Migration Step

1. Keep the DB file between runs if you want incremental updates instead of full reload on startup.
2. Optionally serve Canada GeoJSON from backend (`/api/provinces`) for full backend ownership.
3. Add migrations/seed scripts so schema and load logic are versioned separately from app startup.
