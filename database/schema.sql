-- Normalized schema for choropleth metrics

CREATE TABLE IF NOT EXISTS provinces (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS facilities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS facility_groups (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS facility_group_members (
  group_id INTEGER NOT NULL,
  facility_id INTEGER NOT NULL,
  PRIMARY KEY (group_id, facility_id),
  FOREIGN KEY (group_id) REFERENCES facility_groups(id),
  FOREIGN KEY (facility_id) REFERENCES facilities(id)
);

CREATE TABLE IF NOT EXISTS conditions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  weight INTEGER,
  CHECK (weight IS NULL OR (weight >= 1 AND weight <= 5))
);

CREATE TABLE IF NOT EXISTS conditionMetrics (
  id INTEGER PRIMARY KEY,
  province_id INTEGER NOT NULL,
  facility_id INTEGER NOT NULL,
  condition_id INTEGER NOT NULL,
  value_percent REAL NOT NULL,
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  FOREIGN KEY (facility_id) REFERENCES facilities(id),
  FOREIGN KEY (condition_id) REFERENCES conditions(id),
  UNIQUE (province_id, facility_id, condition_id)
);

CREATE INDEX IF NOT EXISTS idx_conditionMetrics_dimensions
  ON conditionMetrics(province_id, facility_id, condition_id);
