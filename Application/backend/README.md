# LogLens Backend

This backend exposes a FastAPI service for log analysis powered by a Google Gemini-compatible AI model and stores results in a PostgreSQL database. It also caches repeated log analysis requests in Redis.

## What each file does

- `Dockerfile`
  - Builds a Python 3.12 container, installs dependencies from `requirements.txt`, copies the `app` folder, and starts the FastAPI application with Uvicorn on port `8000`.

- `requirements.txt`
  - Lists the Python dependencies required to run the backend, including FastAPI, SQLAlchemy, Redis client, OpenAI-compatible API client, and Prometheus instrumentation.

- `app/__init__.py`
  - Exposes the package as a Python module. It is currently empty and used for package import resolution.

- `app/main.py`
  - The FastAPI application entrypoint.
  - Configures CORS and Prometheus metrics.
  - Initializes the database on startup.
  - Defines endpoints:
    - `GET /healthz`: returns service health and Redis availability.
    - `POST /api/logs/analyze`: accepts logs, caches results, calls AI analysis, stores a report and findings in the database, and returns structured analysis.
    - `GET /api/reports`: lists recently stored analysis reports with optional query filtering.
    - `GET /api/reports/{report_id}`: returns a single stored report.
  - Uses SQLAlchemy ORM models from `db.py` and Pydantic schemas from `schemas.py`.

- `app/ai.py`
  - Contains the AI integration logic.
  - Builds a prompt and sends logs to a Gemini-compatible model through an OpenAI-compatible client.
  - Parses the returned structured function call JSON into analysis details.
  - Truncates very large logs before sending them to avoid exceeding request limits.

- `app/cache.py`
  - Implements Redis-based caching for log analysis results.
  - Generates a deterministic cache key from the log text.
  - Provides `get_cached`, `set_cached`, and `ping` helpers.

- `app/config.py`
  - Defines environment-configurable settings using `pydantic-settings`.
  - Includes database URL, Redis URL, Gemini API key and endpoint, model selection, and cache TTL.

- `app/db.py`
  - Defines SQLAlchemy ORM models and database initialization.
  - `AnalysisReport` stores metadata, severity, summary, counts, top patterns, root causes, suggested fixes, confidence, and raw log text.
  - `AnalysisFinding` stores individual items extracted from the report and links back to the report.
  - `init_db()` creates tables automatically on startup.

- `app/schemas.py`
  - Defines Pydantic request and response models used by FastAPI.
  - `AnalyzeRequest` validates incoming log input.
  - `ReportOut` and `ReportFull` define the shape of returned report data.

## Running locally

1. Set environment variables or create a `.env` file with:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `GEMINI_API_KEY`
   - `GEMINI_BASE_URL` (optional)
   - `GEMINI_MODEL` (optional)

2. Start PostgreSQL and Redis services.
3. Run the app:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Notes

- The backend assumes Redis and PostgreSQL are reachable at the configured URLs.
- AI analysis is cached for repeated identical log content.
- Prometheus metrics are exposed at `/metrics`.
