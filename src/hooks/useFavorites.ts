import { useState, useEffect, useCallback } from "react";
import type { BusStop } from "../types";

const STORAGE_KEY = "bus_stop_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<BusStop[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = useCallback((stop: BusStop) => {
    setFavorites((prev) =>
      prev.find((s) => s.id === stop.id) ? prev : [...prev, stop]
    );
  }, []);

  const removeFavorite = useCallback((stopId: string) => {
    setFavorites((prev) => prev.filter((s) => s.id !== stopId));
  }, []);

  const isFavorite = useCallback(
    (stopId: string) => favorites.some((s) => s.id === stopId),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
