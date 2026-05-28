# Helm README — values.yaml snippets for LogLens

This file contains minimal `values.yaml` snippets you can copy into the backend/frontend chart values when installing with Helm. Replace placeholders with your real values and avoid storing secrets in repo values for production.

---

## Backend chart — secrets and image

If you want Helm to *not* create secrets (recommended for production), set `secret.create=false` and manage `loglens-secrets` externally (ExternalSecrets, SealedSecrets, or `kubectl create secret`).

Example `values.yaml` (recommended - Helm will use existing `loglens-secrets`):

```yaml
image:
  repository: <registry>/loglens-backend
  tag: "1.0"

secret:
  create: false     # use pre-existing kubernetes Secret named `loglens-secrets`

migrate:
  enabled: true     # optional: run DB init job as Helm hook
```

If you want Helm to create the secret for convenience (NOT recommended for prod because values.yaml will contain secrets):

```yaml
secret:
  create: true
  name: loglens-secrets
  values:
    GEMINI_API_KEY: "REPLACE_WITH_KEY"
    DATABASE_URL: "postgresql+psycopg://loglens:REPLACE@postgres.example.svc.cluster.local:5432/loglens"
    REDIS_URL: "redis://redis-master:6379/0"
```

---

## Frontend chart — ingress and host

Example `values.yaml` for frontend ingress configuration:

```yaml
image:
  repository: <registry>/loglens-frontend
  tag: "1.0"

ingress:
  enabled: true
  className: alb                # or nginx, contour, etc.
  hosts:
    - host: "your.frontend.host"
      paths:
        - path: /
          pathType: ImplementationSpecific
  tls: []                       # add TLS config here

# If your frontend needs a build-time API URL, set it when building the image or via this value
# e.g. VITE_API_URL: "https://api.your.frontend.host"
```

---

## Notes & recommended workflow

- Prefer `secret.create=false` and manage secrets external to Helm in production.
- For GitOps: commit `k8s/loglens-secret.yaml` (encrypted or sealed) and let your GitOps controller apply it.
- After changing the `loglens-secrets` Secret, restart the backend deployment:

```bash
kubectl -n loglens rollout restart deployment loglens-backend
```

- Use the repository `Tools-installation` guides for detailed Postgres/Redis installation and storage settings.

Note on Ingress controller:

The charts and example `k8s/` manifests are configured for the AWS ALB Ingress Controller by default (look for `kubernetes.io/ingress.class: alb` and `alb.ingress.kubernetes.io/*` annotations). If you use a different ingress controller (nginx, traefik, contour, etc.), update the ingress class and remove or replace ALB-specific annotations in:

- `helm/frontend/values.yaml` and `helm/backend/values.yaml` (set `kubernetes.io/ingress.class` or `ingress.className`)
- chart templates: `helm/*/templates/ingress.yaml`
- raw manifests: `k8s/*/ingress*.yaml`

Make the changes appropriate for your environment and reapply the manifests or upgrade the Helm releases.

---

See `k8s/loglens-secret.yaml` for a secret template (use `stringData` for plaintext). An example backend `values.yaml` is available at `helm/backend/values.yaml` for local vs production guidance.
