import { useState, useEffect, useCallback } from "react";
import type { Arrival } from "../types";
import { getArrivals } from "../services/tfl";

const REFRESH_INTERVAL_MS = 30_000;

export function useArrivals(stopId: string | null) {
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArrivals = useCallback(async () => {
    if (!stopId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getArrivals(stopId);
      setArrivals(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch arrivals");
    } finally {
      setLoading(false);
    }
  }, [stopId]);

  useEffect(() => {
    fetchArrivals();
    const interval = setInterval(fetchArrivals, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchArrivals]);

  return { arrivals, loading, error, refresh: fetchArrivals };
}
