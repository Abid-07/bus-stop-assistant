# London Bus Stop Assistant

A FastAPI app for checking live TfL bus arrivals for your favourite London stops.

## Run locally

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
# or: source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Then open:

http://localhost:8000

## Notes

- No API key is required for basic use.
- If you want higher TfL rate limits, add `TFL_APP_KEY` to `.env`.
- The app stores favourite bus stops in the browser with `localStorage`.

