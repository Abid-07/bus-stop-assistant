import type { BusStop } from "../types";
import "./FavoritesList.css";

interface Props {
  favorites: BusStop[];
  nearestId: string | null;
  onRemove: (id: string) => void;
  onSelect: (stop: BusStop) => void;
  selectedId: string | null;
}

export function FavoritesList({
  favorites,
  nearestId,
  onRemove,
  onSelect,
  selectedId,
}: Props) {
  if (favorites.length === 0) {
    return (
      <p className="empty-msg">
        No favourite stops yet. Search and add stops above.
      </p>
    );
  }

  return (
    <ul className="favorites-list">
      {favorites.map((stop) => (
        <li
          key={stop.id}
          className={[
            selectedId === stop.id ? "selected" : "",
            nearestId === stop.id ? "nearest" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <button className="stop-btn" onClick={() => onSelect(stop)}>
            <span className="stop-name">{stop.name}</span>
            {stop.towards && (
              <span className="stop-towards">→ {stop.towards}</span>
            )}
            {nearestId === stop.id && (
              <span className="nearest-badge">📍 Nearest</span>
            )}
          </button>
          <button
            className="remove-btn"
            onClick={() => onRemove(stop.id)}
            aria-label={`Remove ${stop.name}`}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
