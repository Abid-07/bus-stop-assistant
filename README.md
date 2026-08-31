# 🚌 London Bus Stop Assistant

A Python (FastAPI) web app that shows live TfL bus arrival times for your favourite London bus stops, based on your current location.

## Features

- **Geolocation** – detects your current position (via the browser)
- **Favourite stops** – search TfL bus stops and save your favourites (e.g. Canary Wharf → Isle of Dogs)
- **Nearest stop** – automatically highlights and selects the favourite stop closest to you
- **Nearby stops** – finds bus stops within a configurable radius (default 800m) of your location
- **Live arrivals** – fetches real-time bus arrivals via the TfL Unified API, auto-refreshing every 30 seconds
- **Line filter** – tap bus line chips to filter the arrival board (e.g. show only the 277 or D3)
- **Persistent storage** – favourite stops are saved to the browser's `localStorage`

## Getting Started

```bash
python -m venv .venv
.venv\Scripts\activate   # on Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open [http://localhost:8000](http://localhost:8000).

No API key is required – the [TfL Unified API](https://api.tfl.gov.uk) allows unauthenticated access with a reasonable rate limit.

## Project structure

```
app/
  main.py         FastAPI app: API routes + static file serving
  tfl_client.py   Async TfL API client (search, nearby, arrivals, distance)
static/
  index.html      Page markup (tabs: Arrivals / Nearby / Favourites)
  style.css       Styling
  app.js          Frontend logic (geolocation, favourites, rendering)
```

## Usage

1. Allow location access when prompted.
2. Go to the **Favourites** tab and search for your bus stops (e.g. "Canary Wharf Station"), or use the **Nearby** tab to browse stops within a radius of your current location.
3. Add the direction you care about (e.g. towards Isle Of Dogs or Leamouth).
4. Return to the **Arrivals** tab – the nearest stop is highlighted and arrivals load automatically.
5. Use the line filter chips to focus on specific bus lines.

