"""FastAPI backend for the Bus Stop Assistant: serves the API and static frontend."""

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

from app.tfl_client import get_arrivals, search_bus_stops, search_nearby_bus_stops

load_dotenv()

app = FastAPI(title="Bus Stop Assistant")

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@app.get("/api/search")
async def api_search(q: str):
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    try:
        return await search_bus_stops(q.strip())
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"TfL search failed: {exc}") from exc


@app.get("/api/nearby")
async def api_nearby(lat: float, lon: float, radius: float = 800):
    try:
        return await search_nearby_bus_stops(lat, lon, radius)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"TfL nearby search failed: {exc}") from exc


@app.get("/api/arrivals/{stop_id}")
async def api_arrivals(stop_id: str):
    try:
        return await get_arrivals(stop_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"TfL arrivals failed: {exc}") from exc


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
