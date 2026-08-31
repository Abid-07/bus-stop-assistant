import { useState, useMemo, useCallback } from "react";
import { useGeolocation } from "./hooks/useGeolocation";
import { useFavorites } from "./hooks/useFavorites";
import { useArrivals } from "./hooks/useArrivals";
import { haversineDistanceMetres } from "./services/tfl";
import { BusStopSearch } from "./components/BusStopSearch";
import { FavoritesList } from "./components/FavoritesList";
import { ArrivalBoard } from "./components/ArrivalBoard";
import type { BusStop } from "./types";
import "./App.css";

type Tab = "arrivals" | "favorites";

export default function App() {
  const { coords, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>("arrivals");

  // Nearest favourite stop based on current location
  const nearestStop = useMemo(() => {
    if (!coords || favorites.length === 0) return null;
    return favorites.reduce<BusStop>((nearest, stop) => {
      const d = haversineDistanceMetres(coords.lat, coords.lon, stop.lat, stop.lon);
      const nd = haversineDistanceMetres(coords.lat, coords.lon, nearest.lat, nearest.lon);
      return d < nd ? stop : nearest;
    }, favorites[0]);
  }, [coords, favorites]);

  // Auto-select the nearest stop when it changes (if nothing manually selected)
  const activeStop = selectedStop ?? nearestStop;

  const { arrivals, loading: arrivalsLoading, error: arrivalsError, refresh } =
    useArrivals(activeStop?.id ?? null);

  const handleClearLines = useCallback(() => {
    setSelectedLines([]);
  }, []);

  const handleToggleLine = useCallback((line: string) => {
    setSelectedLines((prev) =>
      prev.includes(line) ? prev.filter((l) => l !== line) : [...prev, line]
    );
  }, []);

  const handleAddFavorite = useCallback(
    (stop: BusStop) => {
      addFavorite(stop);
    },
    [addFavorite]
  );

  const handleRemoveFavorite = useCallback(
    (id: string) => {
      removeFavorite(id);
      if (selectedStop?.id === id) setSelectedStop(null);
    },
    [removeFavorite, selectedStop]
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚌 London Bus Stop Assistant</h1>
        <div className="location-bar">
          {geoLoading && <span className="status">📡 Getting location…</span>}
          {geoError && (
            <span className="status error">
              {geoError}{" "}
              <button onClick={requestLocation} className="retry-btn">
                Retry
              </button>
            </span>
          )}
          {coords && !geoLoading && (
            <span className="status ok">
              📍 {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
            </span>
          )}
        </div>
      </header>

      <nav className="tabs">
        <button
          className={tab === "arrivals" ? "active" : ""}
          onClick={() => setTab("arrivals")}
        >
          🕐 Arrivals
        </button>
        <button
          className={tab === "favorites" ? "active" : ""}
          onClick={() => setTab("favorites")}
        >
          ⭐ Favourites ({favorites.length})
        </button>
      </nav>

      <main className="app-main">
        {tab === "arrivals" && (
          <section>
            {favorites.length === 0 && (
              <div className="onboarding">
                <p>
                  Add your favourite bus stops in the{" "}
                  <button className="link-btn" onClick={() => setTab("favorites")}>
                    Favourites
                  </button>{" "}
                  tab to see live arrivals.
                </p>
              </div>
            )}
            {favorites.length > 0 && (
              <>
                <div className="stop-selector">
                  <h2 className="section-title">Your Favourite Stops</h2>
                  <FavoritesList
                    favorites={favorites}
                    nearestId={nearestStop?.id ?? null}
                    onRemove={handleRemoveFavorite}
                    onSelect={(stop) => {
                      setSelectedStop(stop);
                      setSelectedLines([]);
                    }}
                    selectedId={activeStop?.id ?? null}
                  />
                </div>

                {activeStop && (
                  <div className="board-container">
                    <ArrivalBoard
                      arrivals={arrivals}
                      loading={arrivalsLoading}
                      error={arrivalsError}
                      stopName={activeStop.name + (activeStop.towards ? ` → ${activeStop.towards}` : "")}
                      selectedLines={selectedLines}
                      onToggleLine={handleToggleLine}
                      onClearLines={handleClearLines}
                      onRefresh={refresh}
                    />
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {tab === "favorites" && (
          <section>
            <h2 className="section-title">Add Favourite Bus Stops</h2>
            <BusStopSearch onAdd={handleAddFavorite} isFavorite={isFavorite} />
            <h2 className="section-title">Saved Favourites</h2>
            <FavoritesList
              favorites={favorites}
              nearestId={nearestStop?.id ?? null}
              onRemove={handleRemoveFavorite}
              onSelect={(stop) => {
                setSelectedStop(stop);
                setTab("arrivals");
              }}
              selectedId={activeStop?.id ?? null}
            />
          </section>
        )}
      </main>
    </div>
  );
}
