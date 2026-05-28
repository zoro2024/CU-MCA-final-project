# LogLens AI

![alt text](./Tools-installation/images/example.png)

A compact LogLens application combining a FastAPI backend, a React/Vite frontend, and deployment artifacts for Docker Compose, Helm charts, and raw Kubernetes manifests.

**What this repo contains**
- `backend/` - FastAPI service (Python).
- `frontend/` - React + Vite UI served via `nginx` in production images.
- `docker-compose.yml` - Local development stack (Postgres, Redis, backend, frontend).
- `helm/` - Helm charts for backend and frontend (production-grade defaults).
- `k8s/` - Raw Kubernetes manifests (an alternative to Helm).

**High-level architecture**
- Frontend serves static UI and proxies API requests to `/api`.
- Backend (`/api/*`) is a FastAPI service that reads/writes Postgres and uses Redis for caching.
- AI integration lives in `backend/app/ai.py` and uses Google Gemini via an OpenAI-compatible endpoint.

**What the app does**
- LogLens analyzes raw application logs and returns a structured analysis that explains the meaning of errors, highlights root causes, and suggests actionable fixes. It:
  - Extracts and summarizes error patterns and their frequency.
  - Produces a short human-readable summary and a severity score.
  - Lists likely root causes and step-by-step suggested fixes.
  - Stores analysis reports for later search, review, and auditing.

**Benefits**
- Faster incident triage: reduces time-to-first-diagnosis by surfacing likely causes.
- Actionable remediation: gives prioritized suggested fixes you can test quickly.
- Searchable history: retain past analyses to find regressions and recurring issues.
- Integrates with CI/CD: automate log analysis in pipelines to prevent regressions.

**Important:** you must provide a valid `GEMINI_API_KEY` for AI features to work. For local development set it in the repository `.env` file. For Kubernetes/Helm, set it in the `loglens-secrets` Kubernetes Secret (see below).

**Quick links**
- API: `/api/*` (Backend APIs, Swagger UI: `/docs`)
- Backend health: `/healthz`
- Frontend health: `/frontend-healthz`
- Metrics: `/metrics`

**Prerequisites**
- Docker & Docker Compose (for local)
- kubectl + Helm (for Kubernetes)
- Postgres and Redis: the app requires Postgres and Redis to be available. For installation instructions refer to the repository tool guides:
  - [Postgres guide](../Tools-installation/postgres/Readme.md)
  - [Redis guide](../Tools-installation/redis/Readme.md)

--------------------------------------------------------------------------------

**Local development (recommended for iterative work)**

1. Copy the example env and add your Gemini key:

```bash
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=replace-with-your-gemini-api-key
```

2. Start the full stack using Docker Compose:

```bash
docker compose up --build
```

3. Access the app:
- Frontend: http://localhost:5173
- Backend docs: http://localhost:8000/docs
- Health: http://localhost:8000/healthz

Notes:
- Local compose includes Postgres and Redis containers. For local testing you only need to set `GEMINI_API_KEY` in `.env`.
- The `frontend`'s `nginx` configuration exposes a simple frontend health endpoint at `/frontend-healthz` and proxies `/api/*`, `/healthz`, and `/metrics` to the backend (see `frontend/nginx.conf`).

--------------------------------------------------------------------------------

**Environment variables (key ones to know)**
- `GEMINI_API_KEY` — required for AI calls. Change locally in `.env` and in Kubernetes via the `loglens-secrets` Secret.
- `GEMINI_MODEL` — model name (default: `gemini-2.5-flash`).
- `GEMINI_BASE_URL` — endpoint used for AI provider compatibility.
- `DATABASE_URL` — SQLAlchemy URL for Postgres.
- `REDIS_URL` — Redis connection URL.
- `CACHE_TTL_SECONDS` — cache TTL used by the app.

--------------------------------------------------------------------------------

**Kubernetes / Helm deployment (production)**

Overview: deploy Postgres + Redis first (example uses Bitnami charts), create the `loglens-secrets` Secret containing `GEMINI_API_KEY`, `DATABASE_URL`, and `REDIS_URL`, then install the backend and frontend Helm releases. See the repository's tool installation guides for platform-specific instructions: [Tools-installation/postgres/Readme.md](../Tools-installation/postgres/Readme.md) and [Tools-installation/redis/Readme.md](../Tools-installation/redis/Readme.md).

Example commands (replace placeholders):

```bash
# 1) Install dependencies (example using Bitnami)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm install my-postgres bitnami/postgresql \
  --namespace loglens --create-namespace \
  --set postgresqlUsername=loglens,postgresqlPassword=REPLACE,postgresqlDatabase=loglens

helm install my-redis bitnami/redis \
  --namespace loglens --set auth.enabled=false

# 2) Create the kubernetes secret that the app expects
kubectl create secret generic loglens-secrets \
  --namespace loglens \
  --from-literal=GEMINI_API_KEY='REPLACE_WITH_YOUR_KEY' \
  --from-literal=DATABASE_URL='postgresql+psycopg://loglens:REPLACE@my-postgres-postgresql.loglens.svc.cluster.local:5432/loglens' \
  --from-literal=REDIS_URL='redis://my-redis-master.loglens.svc.cluster.local:6379/0'

# 3) Install backend (migrations optional: migrate.enabled=true runs init_db() via a Helm hook)
helm upgrade --install loglens-backend ./helm/backend \
  --namespace loglens \
  --set image=<registry>/loglens-backend:TAG \
  --set secret.create=false \
  --set migrate.enabled=true

# 4) Install frontend
helm upgrade --install loglens-frontend ./helm/frontend \
  --namespace loglens \
  --set image=<registry>/loglens-frontend:TAG \
  --set ingress.host=your.frontend.host
```

- Important notes for Kubernetes:
- Ensure `loglens-secrets`, Postgres, and Redis are deployed before installing the backend. Refer to the `Tools-installation` guides for recommended Postgres/Redis Helm values and storage configuration.
- For production secret management prefer external secret managers (ExternalSecrets, AWS Secrets Manager) and set `--set secret.create=false` when installing the chart so Helm does not store secrets in values files.
- The backend expects a `loglens-secrets` Secret name by default; adapt the chart values if you want a different secret name.

--------------------------------------------------------------------------------

**How to change `GEMINI_API_KEY`**

- Local (docker-compose): edit `.env` in the `Application/` folder and set `GEMINI_API_KEY=replace-with-your-gemini-api-key`.
**How to change `GEMINI_API_KEY`**

- Local (docker-compose): edit `.env` in the `Application/` folder and set `GEMINI_API_KEY=replace-with-your-gemini-api-key`.

- Kubernetes: two options — choose one:

  Option A — GitOps / declarative (recommended): edit `k8s/loglens-secret.yaml` (update `stringData` or `data`) and apply:

  ```bash
  # edit k8s/loglens-secret.yaml
  kubectl -n loglens apply -f k8s/loglens-secret.yaml
  ```

  Option B — Manual (imperative): recreate the secret with `kubectl`:

  ```bash
  kubectl -n loglens delete secret loglens-secrets || true
  kubectl -n loglens create secret generic loglens-secrets \
    --from-literal=GEMINI_API_KEY='your-new-key' \
    --from-literal=DATABASE_URL='your-db-url' \
    --from-literal=REDIS_URL='your-redis-url'
  ```

  After either option, restart the backend so it picks up the new environment variables:

  ```bash
  kubectl -n loglens rollout restart deployment loglens-backend
  ```

--------------------------------------------------------------------------------

**Tips & troubleshooting**
- If the backend shows DB connection errors, verify `DATABASE_URL` and that Postgres is reachable from the cluster.
- If the AI calls fail, confirm `GEMINI_API_KEY`, `GEMINI_BASE_URL`, and `GEMINI_MODEL` are set and reachable from the environment where the backend runs.
