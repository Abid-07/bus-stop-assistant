# 🚌 London Bus Stop Assistant

A web app that shows live TfL bus arrival times for your favourite London bus stops, based on your current location.

## Features

- **Geolocation** – detects your current position
- **Favourite stops** – search TfL bus stops and save your favourites (e.g. Canary Wharf → Isle of Dogs)
- **Nearest stop** – automatically highlights and selects the favourite stop closest to you
- **Live arrivals** – fetches real-time bus arrivals via the TfL Unified API, auto-refreshing every 30 seconds
- **Line filter** – tap bus line chips to filter the arrival board (e.g. show only the 277 or D3)
- **Persistent storage** – favourite stops are saved to `localStorage`

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

No API key is required – the [TfL Unified API](https://api.tfl.gov.uk) allows unauthenticated access with a reasonable rate limit.

## Usage

1. Allow location access when prompted.
2. Go to the **Favourites** tab and search for your bus stops (e.g. "Canary Wharf Station").
3. Add the direction you care about (e.g. towards Isle Of Dogs or Leamouth).
4. Return to the **Arrivals** tab – the nearest stop is highlighted and arrivals load automatically.
5. Use the line filter chips to focus on specific bus lines.
