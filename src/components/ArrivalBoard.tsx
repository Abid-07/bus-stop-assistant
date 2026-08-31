import type { Arrival } from "../types";
import "./ArrivalBoard.css";

interface Props {
  arrivals: Arrival[];
  loading: boolean;
  error: string | null;
  stopName: string;
  selectedLines: string[];
  onToggleLine: (line: string) => void;
  onClearLines: () => void;
  onRefresh: () => void;
}

function formatMinutes(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins <= 0) return "Due";
  return `${mins} min`;
}

export function ArrivalBoard({
  arrivals,
  loading,
  error,
  stopName,
  selectedLines,
  onToggleLine,
  onClearLines,
  onRefresh,
}: Props) {
  const allLines = Array.from(new Set(arrivals.map((a) => a.lineName))).sort();

  const filtered =
    selectedLines.length === 0
      ? arrivals
      : arrivals.filter((a) => selectedLines.includes(a.lineName));

  return (
    <div className="arrival-board">
      <div className="board-header">
        <h2>{stopName}</h2>
        <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
          {loading ? "⏳" : "🔄"} Refresh
        </button>
      </div>

      {allLines.length > 0 && (
        <div className="line-filters">
          <span className="filter-label">Filter by line:</span>
          {allLines.map((line) => (
            <button
              key={line}
              className={`line-chip ${selectedLines.includes(line) ? "active" : ""}`}
              onClick={() => onToggleLine(line)}
            >
              {line}
            </button>
          ))}
          {selectedLines.length > 0 && (
            <button className="clear-filters" onClick={onClearLines}>
              Clear
            </button>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {!loading && filtered.length === 0 && !error && (
        <p className="no-arrivals">No arrivals to show.</p>
      )}

      {filtered.length > 0 && (
        <table className="arrivals-table">
          <thead>
            <tr>
              <th>Bus</th>
              <th>Destination</th>
              <th>Arrives</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>
                  <span className="line-badge">{a.lineName}</span>
                </td>
                <td>{a.destinationName}</td>
                <td className="time-cell">{formatMinutes(a.timeToStation)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="refresh-note">Auto-refreshes every 30 seconds.</p>
    </div>
  );
}
