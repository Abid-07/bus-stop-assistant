// Bus Stop Assistant — vanilla JS frontend for the Python/FastAPI backend.

const FAVORITES_KEY = "bus_stop_favorites";
const REFRESH_INTERVAL_MS = 30_000;
const DEFAULT_RADIUS_METRES = 800;

const state = {
  favorites: loadFavorites(),
  coords: null,
  radiusMetres: DEFAULT_RADIUS_METRES,
  nearbyStops: [],
  selectedStop: null,
  selectedLines: [],
  arrivals: [],
  arrivalsTimer: null,
  activeTab: "arrivals",
};

// ---------- storage ----------

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favorites));
}

function isFavorite(id) {
  return state.favorites.some((s) => s.id === id);
}

function addFavorite(stop) {
  if (!isFavorite(stop.id)) {
    state.favorites.push(stop);
    saveFavorites();
    renderAll();
  }
}

function removeFavorite(id) {
  state.favorites = state.favorites.filter((s) => s.id !== id);
  saveFavorites();
  if (state.selectedStop?.id === id) selectStop(null);
  renderAll();
}

// ---------- geometry ----------

function haversineDistanceMetres(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(metres) {
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
}

function nearestFavorite() {
  if (!state.coords || state.favorites.length === 0) return null;
  return state.favorites.reduce((nearest, stop) => {
    const d = haversineDistanceMetres(state.coords.lat, state.coords.lon, stop.lat, stop.lon);
    const nd = haversineDistanceMetres(state.coords.lat, state.coords.lon, nearest.lat, nearest.lon);
    return d < nd ? stop : nearest;
  }, state.favorites[0]);
}

// ---------- API ----------

async function apiSearch(query) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

async function apiNearby(lat, lon, radius) {
  const res = await fetch(`/api/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
  if (!res.ok) throw new Error(`Nearby search failed: ${res.status}`);
  return res.json();
}

async function apiArrivals(stopId) {
  const res = await fetch(`/api/arrivals/${encodeURIComponent(stopId)}`);
  if (!res.ok) throw new Error(`Arrivals failed: ${res.status}`);
  return res.json();
}

// ---------- geolocation ----------

function requestLocation() {
  const bar = document.getElementById("location-bar");
  if (!navigator.geolocation) {
    bar.innerHTML = `<span class="status error">Geolocation is not supported by your browser.</span>`;
    return;
  }
  bar.innerHTML = `<span class="status">📡 Getting location…</span>`;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      bar.innerHTML = `<span class="status ok">📍 ${state.coords.lat.toFixed(5)}, ${state.coords.lon.toFixed(5)}</span>`;
      renderAll();
      refreshNearby();
    },
    (err) => {
      bar.innerHTML = `<span class="status error">Location error: ${err.message} <button class="retry-btn" id="retry-location-btn">Retry</button></span>`;
      document.getElementById("retry-location-btn").addEventListener("click", requestLocation);
      renderAll();
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ---------- arrivals ----------

function selectStop(stop) {
  state.selectedStop = stop;
  state.selectedLines = [];
  clearInterval(state.arrivalsTimer);
  if (stop) {
    fetchArrivals();
    state.arrivalsTimer = setInterval(fetchArrivals, REFRESH_INTERVAL_MS);
  } else {
    state.arrivals = [];
  }
  renderAll();
}

async function fetchArrivals() {
  if (!state.selectedStop) return;
  try {
    state.arrivals = await apiArrivals(state.selectedStop.id);
    state.arrivalsError = null;
  } catch (e) {
    state.arrivalsError = e.message;
  }
  renderBoards();
}

function toggleLine(line) {
  state.selectedLines = state.selectedLines.includes(line)
    ? state.selectedLines.filter((l) => l !== line)
    : [...state.selectedLines, line];
  renderBoards();
}

function formatMinutes(seconds) {
  const mins = Math.round(seconds / 60);
  return mins <= 0 ? "Due" : `${mins} min`;
}

function renderArrivalBoard(containerId, stopName) {
  const container = document.getElementById(containerId);
  if (!state.selectedStop) {
    container.innerHTML = "";
    return;
  }
  const allLines = Array.from(new Set(state.arrivals.map((a) => a.lineName))).sort();
  const filtered =
    state.selectedLines.length === 0
      ? state.arrivals
      : state.arrivals.filter((a) => state.selectedLines.includes(a.lineName));

  container.innerHTML = `
    <div class="board-header">
      <h2>${escapeHtml(stopName)}</h2>
      <button class="refresh-btn" id="${containerId}-refresh-btn">🔄 Refresh</button>
    </div>
    ${
      allLines.length > 0
        ? `<div class="line-filters">
            <span class="filter-label">Filter by line:</span>
            ${allLines
              .map(
                (line) =>
                  `<button class="line-chip ${state.selectedLines.includes(line) ? "active" : ""}" data-line="${escapeHtml(line)}">${escapeHtml(line)}</button>`
              )
              .join("")}
            ${state.selectedLines.length > 0 ? `<button class="clear-filters" id="${containerId}-clear-btn">Clear</button>` : ""}
          </div>`
        : ""
    }
    ${state.arrivalsError ? `<p class="error">${escapeHtml(state.arrivalsError)}</p>` : ""}
    ${
      filtered.length === 0 && !state.arrivalsError
        ? `<p class="no-arrivals">No arrivals to show.</p>`
        : ""
    }
    ${
      filtered.length > 0
        ? `<table class="arrivals-table">
            <thead><tr><th>Bus</th><th>Destination</th><th>Arrives</th></tr></thead>
            <tbody>
              ${filtered
                .map(
                  (a) => `<tr>
                    <td><span class="line-badge">${escapeHtml(a.lineName)}</span></td>
                    <td>${escapeHtml(a.destinationName)}</td>
                    <td class="time-cell">${formatMinutes(a.timeToStation)}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>`
        : ""
    }
    <p class="refresh-note">Auto-refreshes every 30 seconds.</p>
  `;

  document.getElementById(`${containerId}-refresh-btn`).addEventListener("click", fetchArrivals);
  container.querySelectorAll(".line-chip").forEach((btn) =>
    btn.addEventListener("click", () => toggleLine(btn.dataset.line))
  );
  const clearBtn = document.getElementById(`${containerId}-clear-btn`);
  if (clearBtn) clearBtn.addEventListener("click", () => { state.selectedLines = []; renderBoards(); });
}

function renderBoards() {
  const stopName = state.selectedStop
    ? state.selectedStop.name + (state.selectedStop.towards ? ` → ${state.selectedStop.towards}` : "")
    : "";
  if (state.activeTab === "arrivals") renderArrivalBoard("arrival-board-arrivals", stopName);
  if (state.activeTab === "nearby" && state.nearbyStops.some((s) => s.id === state.selectedStop?.id)) {
    renderArrivalBoard("arrival-board-nearby", stopName);
  } else if (state.activeTab === "nearby") {
    document.getElementById("arrival-board-nearby").innerHTML = "";
  }
}

// ---------- nearby ----------

async function refreshNearby() {
  if (!state.coords) return;
  const list = document.getElementById("nearby-list");
  try {
    state.nearbyStops = await apiNearby(state.coords.lat, state.coords.lon, state.radiusMetres);
    state.nearbyError = null;
  } catch (e) {
    state.nearbyError = e.message;
  }
  renderNearby();
}

function renderNearby() {
  document.getElementById("nearby-onboarding").hidden = !!state.coords;
  document.getElementById("nearby-content").hidden = !state.coords;
  if (!state.coords) return;

  document.getElementById("radius-value").textContent = formatDistance(state.radiusMetres);

  const list = document.getElementById("nearby-list");
  if (state.nearbyError) {
    list.innerHTML = `<p class="error">${escapeHtml(state.nearbyError)}</p>`;
  } else if (state.nearbyStops.length === 0) {
    list.innerHTML = `<p class="empty-msg">No bus stops found within ${formatDistance(state.radiusMetres)}. Try a larger radius.</p>`;
  } else {
    list.innerHTML = state.nearbyStops
      .map(
        (stop) => `<li class="${state.selectedStop?.id === stop.id ? "selected" : ""}">
          <button class="stop-btn" data-id="${escapeHtml(stop.id)}">
            <span class="stop-name">${escapeHtml(stop.name)}</span>
            ${stop.towards ? `<span class="stop-towards">${escapeHtml(stop.towards)}</span>` : ""}
            <span class="stop-distance">📍 ${formatDistance(stop.distanceMeters)}</span>
          </button>
          <button class="add-btn" data-fav-id="${escapeHtml(stop.id)}" ${isFavorite(stop.id) ? "disabled" : ""}>
            ${isFavorite(stop.id) ? "✓ Added" : "+ Add"}
          </button>
        </li>`
      )
      .join("");
    list.querySelectorAll(".stop-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        const stop = state.nearbyStops.find((s) => s.id === btn.dataset.id);
        selectStop(stop);
        setTab("nearby");
      })
    );
    list.querySelectorAll(".add-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        const stop = state.nearbyStops.find((s) => s.id === btn.dataset.favId);
        addFavorite(stop);
      })
    );
  }
  renderBoards();
}

// ---------- favorites & search rendering ----------

function renderFavoritesList(containerId, { showRemove }) {
  const container = document.getElementById(containerId);
  const nearest = nearestFavorite();
  if (state.favorites.length === 0) {
    container.innerHTML = `<p class="empty-msg">No favourite stops yet. Search and add stops above.</p>`;
    return;
  }
  container.innerHTML = state.favorites
    .map((stop) => {
      const classes = [
        state.selectedStop?.id === stop.id ? "selected" : "",
        nearest?.id === stop.id ? "nearest" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<li class="${classes}">
        <button class="stop-btn" data-id="${escapeHtml(stop.id)}">
          <span class="stop-name">${escapeHtml(stop.name)}</span>
          ${stop.towards ? `<span class="stop-towards">→ ${escapeHtml(stop.towards)}</span>` : ""}
          ${nearest?.id === stop.id ? `<span class="nearest-badge">📍 Nearest</span>` : ""}
        </button>
        ${showRemove ? `<button class="remove-btn" data-remove-id="${escapeHtml(stop.id)}" aria-label="Remove ${escapeHtml(stop.name)}">✕</button>` : ""}
      </li>`;
    })
    .join("");

  container.querySelectorAll(".stop-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      const stop = state.favorites.find((s) => s.id === btn.dataset.id);
      selectStop(stop);
      setTab("arrivals");
    })
  );
  container.querySelectorAll(".remove-btn").forEach((btn) =>
    btn.addEventListener("click", () => removeFavorite(btn.dataset.removeId))
  );
}

async function handleSearch() {
  const input = document.getElementById("search-input");
  const errorEl = document.getElementById("search-error");
  const resultsEl = document.getElementById("search-results");
  const query = input.value.trim();
  if (!query) return;
  errorEl.hidden = true;
  resultsEl.innerHTML = "";
  try {
    const stops = await apiSearch(query);
    if (stops.length === 0) {
      errorEl.textContent = "No bus stops found.";
      errorEl.hidden = false;
      return;
    }
    resultsEl.innerHTML = stops
      .map(
        (stop) => `<li>
          <div class="stop-info" style="display:flex;flex-direction:column;gap:0.15rem;padding:0.6rem 0 0.6rem 0.75rem;">
            <strong>${escapeHtml(stop.name)}</strong>
            ${stop.towards ? `<span class="towards">→ ${escapeHtml(stop.towards)}</span>` : ""}
            <code class="stop-id">${escapeHtml(stop.id)}</code>
          </div>
          <button class="add-btn" data-id="${escapeHtml(stop.id)}" ${isFavorite(stop.id) ? "disabled" : ""}>
            ${isFavorite(stop.id) ? "✓ Added" : "+ Add"}
          </button>
        </li>`
      )
      .join("");
    resultsEl.querySelectorAll(".add-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        const stop = stops.find((s) => s.id === btn.dataset.id);
        addFavorite(stop);
      })
    );
  } catch {
    errorEl.textContent = "Search failed. Please try again.";
    errorEl.hidden = false;
  }
}

// ---------- tabs ----------

function setTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `tab-${tab}`));
  renderBoards();
}

// ---------- helpers ----------

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- top-level render ----------

function renderAll() {
  document.getElementById("fav-count").textContent = state.favorites.length;
  document.getElementById("arrivals-onboarding").hidden = state.favorites.length > 0;
  document.getElementById("arrivals-content").hidden = state.favorites.length === 0;

  const nearest = nearestFavorite();
  const activeStop = state.selectedStop ?? nearest;
  if (activeStop && !state.selectedStop) selectStop(activeStop);

  renderFavoritesList("favorites-list-arrivals", { showRemove: false });
  renderFavoritesList("favorites-list-favorites", { showRemove: true });
  renderNearby();
  renderBoards();
}

// ---------- init ----------

document.querySelectorAll(".tab-btn").forEach((btn) => btn.addEventListener("click", () => setTab(btn.dataset.tab)));
document.querySelectorAll("[data-goto]").forEach((btn) => btn.addEventListener("click", () => setTab(btn.dataset.goto)));
document.getElementById("search-btn").addEventListener("click", handleSearch);
document.getElementById("search-input").addEventListener("keydown", (e) => e.key === "Enter" && handleSearch());
document.getElementById("enable-location-btn").addEventListener("click", requestLocation);
document.getElementById("refresh-nearby-btn").addEventListener("click", refreshNearby);
document.getElementById("radius-input").addEventListener("input", (e) => {
  state.radiusMetres = Number(e.target.value);
  document.getElementById("radius-value").textContent = formatDistance(state.radiusMetres);
});
document.getElementById("radius-input").addEventListener("change", refreshNearby);

renderAll();
requestLocation();
