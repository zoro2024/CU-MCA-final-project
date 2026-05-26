# PostgreSQL Installation Guide on Kubernetes using Bitnami Helm Chart

## Prerequisites

- Kubernetes Cluster
- Helm installed
- AWS EBS CSI Driver installed
- kubectl configured

---

# 1. Add Bitnami Helm Repository

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

---

# 2. Create PostgreSQL Namespace

```bash
helm install postgres bitnami/postgresql \
  --namespace postgres \
  --create-namespace
```

---

# 3. Navigate to PostgreSQL Configuration Directory

```bash
cd CU-MCA-final-project/Tools-installation/postgres
```

---

# 4. Create Kubernetes Secret

Apply the PostgreSQL secret configuration:

```bash
kubectl apply -f secret.yaml
```

---

# 5. Install PostgreSQL using Helm Values

```bash
helm install postgres bitnami/postgresql \
  -n postgres \
  -f values.yaml
```

---

# 6. Verify Installation

Check pods:

```bash
kubectl get pods -n postgres
```

Check services:

```bash
kubectl get svc -n postgres
```

Check PVC:

```bash
kubectl get pvc -n postgres
```

---

# 7. Connect to PostgreSQL

## Open PostgreSQL Client Pod

```bash
kubectl run postgres-client \
  --rm --tty -i \
  --restart='Never' \
  --namespace postgres \
  --image docker.io/bitnami/postgresql:latest \
  -- bash
```

## Connect to PostgreSQL

```bash
PGPASSWORD=$(kubectl get secret --namespace postgres postgres-secret -o jsonpath="{.data.password}" | base64 -d)

psql -h postgres-postgresql \
  -U appuser \
  -d appdb
```

---

# 8. Verify Persistent Storage

```bash
kubectl get pvc -n postgres
```

```bash
kubectl get pv
```

---

# 9. Upgrade PostgreSQL

```bash
helm upgrade postgres bitnami/postgresql \
  -n postgres \
  -f values.yaml
```

---

# 10. Uninstall PostgreSQL

```bash
helm uninstall postgres -n postgres
```

---

# 11. Cleanup Persistent Volumes (Optional)

```bash
kubectl delete pvc --all -n postgres
```

> Warning: This permanently deletes PostgreSQL data.

---

# Architecture

- PostgreSQL deployed using Bitnami Helm Chart
- Credentials managed using Kubernetes Secrets
- Persistent storage enabled using AWS EBS volumes
- Dynamic volume provisioning enabled through EBS CSI Driver