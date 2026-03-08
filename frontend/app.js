const API_BASE = "http://localhost:3000";
const CANADA_GEOJSON_URL =
  "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/canada.geojson";

const facilityEl = document.getElementById("facility");
const conditionEl = document.getElementById("condition");
const statusEl = document.getElementById("status");

const map = L.map("map", {
  center: [58.5, -96],
  zoom: 3,
  minZoom: 3,
  maxZoom: 10
});
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let geoLayer = null;
let provinceValues = new Map();
let legendContainer = null;

const PROVINCE_ALIASES = {
  "yukon territory": "Yukon",
  newfoundland: "Newfoundland and Labrador"
};

function setStatus(text) {
  statusEl.textContent = text;
}

function fillSelect(selectEl, options) {
  selectEl.innerHTML = "";

  for (let i = 0; i < options.length; i += 1) {
    const option = options[i];
    const el = document.createElement("option");
    el.value = String(option.value);
    el.textContent = option.label;
    selectEl.appendChild(el);
  }
}

function isWeighted() {
  if (conditionEl.value === "weighted_score") {
    return true;
  }
  return false;
}

function colorScale(value) {
  if (value === null || value === undefined) {
    return "#d9d9d9";
  }

  if (isWeighted() === true) {
    if (value > 4.2) return "#084081";
    if (value > 3.6) return "#0868ac";
    if (value > 3.0) return "#2b8cbe";
    if (value > 2.4) return "#4eb3d3";
    if (value > 1.8) return "#7bccc4";
    return "#a8ddb5";
  }

  if (value > 50) return "#084081";
  if (value > 40) return "#0868ac";
  if (value > 30) return "#2b8cbe";
  if (value > 20) return "#4eb3d3";
  if (value > 10) return "#7bccc4";
  return "#a8ddb5";
}

function renderLegend() {
  if (legendContainer === null) {
    return;
  }

  if (isWeighted() === true) {
    const bins = [0, 1.8, 2.4, 3.0, 3.6, 4.2];
    let html = "<strong>Weighted score</strong><br>";

    for (let i = 0; i < bins.length; i += 1) {
      const from = bins[i];
      const to = bins[i + 1];
      const color = colorScale(from + 0.01);
      let line = `${from.toFixed(1)}`;
      if (to !== undefined) {
        line = `${line}&ndash;${to.toFixed(1)}`;
      } else {
        line = `${line}+`;
      }
      html += `<i style="background:${color};border:1px solid #777;display:inline-block;width:12px;height:12px;margin-right:6px;"></i>${line}<br>`;
    }

    html += `<i style="background:#d9d9d9;border:1px solid #777;display:inline-block;width:12px;height:12px;margin-right:6px;"></i>No data`;
    legendContainer.innerHTML = html;
    return;
  }

  const bins = [0, 10, 20, 30, 40, 50];
  let html = "<strong>Value (%)</strong><br>";

  for (let i = 0; i < bins.length; i += 1) {
    const from = bins[i];
    const to = bins[i + 1];
    const color = colorScale(from + 0.1);
    let line = `${from}`;
    if (to !== undefined) {
      line = `${line}&ndash;${to}`;
    } else {
      line = `${line}+`;
    }
    html += `<i style="background:${color};border:1px solid #777;display:inline-block;width:12px;height:12px;margin-right:6px;"></i>${line}<br>`;
  }

  html += `<i style="background:#d9d9d9;border:1px solid #777;display:inline-block;width:12px;height:12px;margin-right:6px;"></i>No data`;
  legendContainer.innerHTML = html;
}

function addLegend() {
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function onAdd() {
    const div = L.DomUtil.create("div");
    div.style.background = "rgba(255,255,255,0.95)";
    div.style.padding = "8px 10px";
    div.style.border = "1px solid #c7d0d9";
    div.style.borderRadius = "8px";
    div.style.fontSize = "12px";
    div.style.lineHeight = "1.4";
    legendContainer = div;
    renderLegend();
    return div;
  };
  legend.addTo(map);
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "No data";
  }

  if (isWeighted() === true) {
    return value.toFixed(2);
  }

  return `${value.toFixed(1)}%`;
}

function normalizeName(value) {
  let out = String(value || "");
  out = out.toLowerCase();
  out = out.replace(/&/g, "and");
  out = out.replace(/[^a-z\s]/g, " ");
  out = out.replace(/\s+/g, " ");
  out = out.trim();
  return out;
}

function canonicalProvince(value) {
  const key = normalizeName(value);
  const maybe = PROVINCE_ALIASES[key];

  if (maybe !== undefined) {
    return maybe;
  }
  return value;
}

function getFeatureProvinceName(feature) {
  return canonicalProvince(feature?.properties?.name || "");
}

function styleFeature(feature) {
  const provinceName = getFeatureProvinceName(feature);
  const value = provinceValues.get(provinceName);

  return {
    fillColor: colorScale(value),
    fillOpacity: 0.85,
    color: "#3f4d5a",
    weight: 1
  };
}

function onEachFeature(feature, layer) {
  const name = getFeatureProvinceName(feature);
  const value = provinceValues.get(name);
  layer.bindTooltip(`<strong>${name}</strong><br>${formatValue(value)}`);

  layer.on({
    mouseover: () => {
      layer.setStyle({ weight: 2, color: "#111" });
      layer.bringToFront();
    },
    mouseout: () => {
      geoLayer.resetStyle(layer);
    }
  });
}

async function loadFilters() {
  const response = await fetch(`${API_BASE}/api/filters`);
  if (!response.ok) {
    throw new Error("Failed to fetch /api/filters");
  }

  const data = await response.json();
  return data;
}

async function loadChoropleth() {
  const params = new URLSearchParams({
    facility: facilityEl.value,
    condition: conditionEl.value
  });

  const url = `${API_BASE}/api/choropleth?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch /api/choropleth");
  }

  const data = await response.json();
  return data;
}

async function refreshMap() {
  const result = await loadChoropleth();
  const rows = result.data || [];

  provinceValues = new Map();

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const provinceName = canonicalProvince(row.province);
    provinceValues.set(provinceName, row.value);
  }

  geoLayer.setStyle(styleFeature);

  geoLayer.eachLayer((layer) => {
    const name = getFeatureProvinceName(layer.feature);
    const value = provinceValues.get(name);
    layer.setTooltipContent(`<strong>${name}</strong><br>${formatValue(value)}`);
  });

  const conditionLabel =
    conditionEl.options[conditionEl.selectedIndex].text.toLowerCase();
  const facilityLabel =
    facilityEl.options[facilityEl.selectedIndex].text.toLowerCase();

  setStatus(`Showing ${conditionLabel} for ${facilityLabel}.`);
  renderLegend();
}

async function init() {
  try {
    // load API options and canada geojson at same time
    const both = await Promise.all([
      loadFilters(),
      fetch(CANADA_GEOJSON_URL).then((r) => r.json())
    ]);

    const filters = both[0];
    const geojson = both[1];

    fillSelect(facilityEl, filters.facilities);
    fillSelect(conditionEl, filters.conditions);

    facilityEl.value = "__all_facilities__";
    conditionEl.value = "weighted_score";

    geoLayer = L.geoJSON(geojson, {
      style: styleFeature,
      onEachFeature
    }).addTo(map);

    map.fitBounds(geoLayer.getBounds(), { padding: [12, 12] });
    addLegend();

    facilityEl.addEventListener("change", refreshMap);
    conditionEl.addEventListener("change", refreshMap);

    await refreshMap();
  } catch (error) {
    setStatus(`Error: ${error.message}`);
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

init();
