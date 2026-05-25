# LogLens AI — FastAPI + React + K8s bundle

Production-style, student-friendly companion to the Lovable web app.

## Stack
- **Backend**: FastAPI (Python 3.12) + SQLAlchemy + Redis cache
- **Frontend**: React + Vite + Tailwind + Recharts
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **AI**: Google Gemini (free tier) via OpenAI-compatible API — abstraction in `app/ai.py`
- **Container**: Docker
- **Orchestration**: Kubernetes (EKS-ready) via Helm
- **Ingress**: AWS ALB Ingress Controller
- **Observability**: Prometheus + Grafana (annotations / ServiceMonitor)

## Run locally (one command)

```bash
cp .env.example .env       # add GEMINI_API_KEY (free: https://aistudio.google.com/apikey)
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:8000/docs
- Health:   http://localhost:8000/healthz

Notes:
- The local setup uses `docker compose` with an `nginx` container serving the frontend and proxying `/api` to the `backend` service. This allows the frontend to call `/api/...` without additional CORS or host configuration.


## Endpoints

| Method | Path                    | Purpose                          |
|-------:|-------------------------|----------------------------------|
| POST   | `/api/logs/analyze`     | Analyze raw logs                 |
| GET    | `/api/reports`          | List reports (search via `?q=`)  |
| GET    | `/api/reports/{id}`     | Get one report                   |
| GET    | `/healthz`              | Liveness/readiness probe         |

## Deploy to EKS

```bash
# Build & push images
docker build -t <ecr>/loglens-backend:1.0 ./backend && docker push <ecr>/loglens-backend:1.0
docker build -t <ecr>/loglens-frontend:1.0 ./frontend && docker push <ecr>/loglens-frontend:1.0

# (1) Install Bitnami Postgres and Redis (recommended as separate releases)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Postgres (example):
helm install my-postgres bitnami/postgresql \
  --namespace loglens --create-namespace \
  --set postgresqlUsername=loglens,postgresqlPassword=REPLACE,postgresqlDatabase=loglens

# Redis (example - secure with a password in production):
helm install my-redis bitnami/redis \
  --namespace loglens --set auth.enabled=false

# (2) Create Kubernetes Secret the app expects (or use your secret manager)
kubectl create secret generic loglens-secrets \
  --namespace loglens \
  --from-literal=GEMINI_API_KEY='REPLACE' \
  --from-literal=DATABASE_URL='postgresql+psycopg://loglens:REPLACE@my-postgres-postgresql.loglens.svc.cluster.local:5432/loglens' \
  --from-literal=REDIS_URL='redis://my-redis-master.loglens.svc.cluster.local:6379/0'

# (3) Install backend and frontend as separate Helm releases
helm upgrade --install loglens-backend ./helm/loglens-backend \
  --namespace loglens \
  --set image=<ecr>/loglens-backend:1.0 \
  --set secret.create=false \
  --set migrate.enabled=true

helm upgrade --install loglens-frontend ./helm/loglens-frontend \
  --namespace loglens \
  --set image=<ecr>/loglens-frontend:1.0 \
  --set ingress.className=alb \
  --set ingress.host=loglens.example.in
```

Prereqs: AWS Load Balancer Controller + a default StorageClass (gp3 recommended).

## Folder map
```
backend/   FastAPI service
frontend/  Vite + React UI
k8s/       Raw manifests (alternative to Helm)
helm/      Helm chart
docker-compose.yml
```

## Notes on secrets and migrations

- Secret management: for production it's recommended to manage secrets outside Helm (e.g. AWS Secrets Manager + ExternalSecrets, or create `Secret` via `kubectl`/CI) and set `helm --set secret.create=false` when installing the `loglens-backend` chart.
- Convenience: the `loglens-backend` chart can create the `loglens-secrets` Secret for you (`secret.create=true` in `helm/loglens-backend/values.yaml`) but this stores literals in your `values.yaml` or CI command and is less secure.
- DB migrations: the backend will create tables on startup (`init_db()`), but you can enable an explicit Helm post-install Job by setting `migrate.enabled=true` (example above). Using a dedicated migration job or an Alembic migration step is recommended for complex schema changes.

## Swap AI provider
`backend/app/ai.py` exposes `analyze_logs(text: str) -> Analysis`. Default uses Gemini's OpenAI-compatible endpoint. To switch to OpenAI, Groq,
Ollama, or any OpenAI-compatible API, just change `GEMINI_BASE_URL`, `GEMINI_MODEL`,
and `GEMINI_API_KEY` in `.env` — no code changes needed.

## Local development vs Kubernetes (what to change)

- **Local (docker compose)**: The repo includes `docker-compose.yml` which starts `postgres`, `redis`, `backend`, and `frontend`. The frontend container runs `nginx` and proxies `/api`, `/healthz`, and `/metrics` to the backend service inside the compose network, so the browser can call `/api/...` without knowing the backend host. Use:

```bash
cp .env.example .env
docker compose up --build
```

- **Kubernetes (EKS) — recommended production flow**:
  - Deploy Postgres and Redis as separate Bitnami releases (examples below).
  - Create a Kubernetes `Secret` (or use ExternalSecrets) named `loglens-secrets` containing `GEMINI_API_KEY`, `DATABASE_URL`, and `REDIS_URL`.
  - Install `loglens-backend` and `loglens-frontend` Helm charts as separate releases. In-cluster you should expose services as `ClusterIP` and let the Ingress controller route `/api` to the backend and `/` to the frontend.

App configuration differences you need to make:
  - Frontend API URL:
    - Option A (recommended): Keep the frontend using relative paths (default in this repo). Configure the Ingress so that requests to `/api` are routed to the backend service. No build-time changes required.
    - Option B: If you serve the frontend from a separate domain (or CDN), set `VITE_API_URL` at build time to the backend base URL (e.g. `https://api.loglens.example.in`). Example:

```bash
# build frontend with explicit API URL
VITE_API_URL="https://api.loglens.example.in" npm run build
# then containerize and push the built image used by the frontend Helm chart
```

  - Secrets / credentials:
    - Recommended: manage secrets externally (AWS Secrets Manager + ExternalSecrets) and set `helm --set secret.create=false` when installing `loglens-backend`.
    - Convenience: set `secret.create=true` in `helm/loglens-backend/values.yaml` or pass `--set secret.create=true` and provide values, but avoid storing sensitive values in the repo.

  - DB migrations:
    - The backend calls `init_db()` on startup which creates tables automatically. For more control you can enable the Helm migration Job by setting `migrate.enabled=true` for `loglens-backend` (the Job runs `init_db()` as a Helm post-install/post-upgrade hook). For production migrations consider using Alembic and an explicit migration job.

Example Helm commands (summary):

```bash
# Install Bitnami DB and cache
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install my-postgres bitnami/postgresql --namespace loglens --create-namespace \
  --set postgresqlUsername=loglens,postgresqlPassword=REPLACE,postgresqlDatabase=loglens
helm install my-redis bitnami/redis --namespace loglens --set auth.enabled=false

# Create the secret (example)
kubectl create secret generic loglens-secrets --namespace loglens \
  --from-literal=GEMINI_API_KEY='REPLACE' \
  --from-literal=DATABASE_URL='postgresql+psycopg://loglens:REPLACE@my-postgres-postgresql.loglens.svc.cluster.local:5432/loglens' \
  --from-literal=REDIS_URL='redis://my-redis-master.loglens.svc.cluster.local:6379/0'

# Install backend + run migration job (migrate.enabled=true runs Helm hook)
helm upgrade --install loglens-backend ./helm/loglens-backend --namespace loglens \
  --set image=<ecr>/loglens-backend:1.0 --set secret.create=false --set migrate.enabled=true

# Install frontend (set ingress host/class as needed)
helm upgrade --install loglens-frontend ./helm/loglens-frontend --namespace loglens \
  --set image=<ecr>/loglens-frontend:1.0 --set ingress.className=alb --set ingress.host=loglens.example.in
```

If you give me the final frontend host (e.g. `loglens.example.in`) I can add the exact `VITE_API_URL` example and a sample `Ingress` host mapping to the README.
