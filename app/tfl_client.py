"""Thin async client for the TfL (Transport for London) public API."""

import math

import httpx

TFL_BASE = "https://api.tfl.gov.uk"


def haversine_distance_metres(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two lat/lon points, in metres."""
    r = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def search_bus_stops(query: str) -> list[dict]:
    """Search bus stops by name."""
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{TFL_BASE}/StopPoint/Search/{query}",
            params={"modes": "bus", "maxResults": 10},
        )
        res.raise_for_status()
        data = res.json()
    return [
        {
            "id": m.get("id"),
            "name": m.get("name"),
            "lat": m.get("lat"),
            "lon": m.get("lon"),
            "towards": m.get("towards"),
        }
        for m in data.get("matches") or []
        if m.get("modes") and "bus" in m["modes"]
    ]


async def search_nearby_bus_stops(lat: float, lon: float, radius_metres: float) -> list[dict]:
    """Find bus stops within `radius_metres` of a point, nearest first."""
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{TFL_BASE}/StopPoint",
            params={
                "lat": lat,
                "lon": lon,
                "radius": round(radius_metres),
                "stopTypes": "NaptanPublicBusCoachTram",
            },
        )
        res.raise_for_status()
        data = res.json()

    stops = []
    for m in data.get("stopPoints") or []:
        stop_lat, stop_lon = m.get("lat"), m.get("lon")
        distance = m.get("distance")
        if distance is None and stop_lat is not None and stop_lon is not None:
            distance = haversine_distance_metres(lat, lon, stop_lat, stop_lon)
        stops.append(
            {
                "id": m.get("id"),
                "name": m.get("commonName"),
                "lat": stop_lat,
                "lon": stop_lon,
                "towards": m.get("indicator"),
                "distanceMeters": distance,
            }
        )
    stops.sort(key=lambda s: s["distanceMeters"] if s["distanceMeters"] is not None else math.inf)
    return stops


async def get_arrivals(stop_id: str) -> list[dict]:
    """Live arrival predictions for a stop, sorted soonest first."""
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{TFL_BASE}/StopPoint/{stop_id}/Arrivals")
        res.raise_for_status()
        data = res.json()

    if not isinstance(data, list):
        raise ValueError("Unexpected response from TfL API")

    arrivals = [
        {
            "id": a.get("id"),
            "lineName": a.get("lineName"),
            "destinationName": a.get("destinationName"),
            "expectedArrival": a.get("expectedArrival"),
            "timeToStation": a.get("timeToStation"),
            "vehicleId": a.get("vehicleId"),
        }
        for a in data
    ]
    arrivals.sort(key=lambda a: a["timeToStation"] if a["timeToStation"] is not None else math.inf)
    return arrivals
