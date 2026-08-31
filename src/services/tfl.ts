import type { BusStop, Arrival } from "../types";

const TFL_BASE = "https://api.tfl.gov.uk";

export async function searchBusStops(query: string): Promise<BusStop[]> {
  const url = `${TFL_BASE}/StopPoint/Search/${encodeURIComponent(query)}?modes=bus&maxResults=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TfL search failed: ${res.status}`);
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.matches ?? []).map((m: any): BusStop => ({
    id: m.id,
    name: m.name,
    lat: m.lat,
    lon: m.lon,
    towards: m.towards,
  }));
}

export async function getArrivals(stopId: string): Promise<Arrival[]> {
  const url = `${TFL_BASE}/StopPoint/${encodeURIComponent(stopId)}/Arrivals`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TfL arrivals failed: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Unexpected response from TfL API");
  return (data as any[])
    .map(
      (a): Arrival => ({
        id: a.id,
        lineName: a.lineName,
        destinationName: a.destinationName,
        expectedArrival: a.expectedArrival,
        timeToStation: a.timeToStation,
        vehicleId: a.vehicleId,
      })
    )
    .sort((a, b) => a.timeToStation - b.timeToStation);
}

export function haversineDistanceMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
