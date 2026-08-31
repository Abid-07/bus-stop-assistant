import { useState } from "react";
import type { BusStop } from "../types";
import { searchBusStops } from "../services/tfl";
import "./BusStopSearch.css";

interface Props {
  onAdd: (stop: BusStop) => void;
  isFavorite: (id: string) => boolean;
}

export function BusStopSearch({ onAdd, isFavorite }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const stops = await searchBusStops(query.trim());
      setResults(stops);
      if (stops.length === 0) setError("No bus stops found.");
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bus-stop-search">
      <div className="search-row">
        <input
          type="text"
          placeholder="Search bus stop (e.g. Canary Wharf)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          aria-label="Search bus stop"
        />
        <button onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((stop) => (
            <li key={stop.id}>
              <div className="stop-info">
                <strong>{stop.name}</strong>
                {stop.towards && (
                  <span className="towards">→ {stop.towards}</span>
                )}
                <code className="stop-id">{stop.id}</code>
              </div>
              <button
                className="add-btn"
                onClick={() => onAdd(stop)}
                disabled={isFavorite(stop.id)}
              >
                {isFavorite(stop.id) ? "✓ Added" : "+ Add"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
