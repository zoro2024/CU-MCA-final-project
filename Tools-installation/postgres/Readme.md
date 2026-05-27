# PostgreSQL Installation Guide on Kubernetes using Bitnami Helm Chart

This guide explains how to deploy PostgreSQL on Kubernetes using the Bitnami Helm chart with persistent storage backed by AWS EBS CSI Driver.

---

# PostgreSQL Architecture

- PostgreSQL deployed using Bitnami Helm Chart
- Credentials managed using Kubernetes Secrets
- Persistent storage enabled using AWS EBS volumes
- Dynamic volume provisioning enabled through EBS CSI Driver
- Helm used for simplified lifecycle management

---

# Public References

## Bitnami PostgreSQL Helm Chart

[Bitnami PostgreSQL Helm Chart](https://github.com/bitnami/charts/tree/main/bitnami/postgresql)

## PostgreSQL Official Documentation

[PostgreSQL Official Documentation](https://www.postgresql.org/docs/)

## Helm Documentation

[Helm Official Documentation](https://helm.sh/docs/)

## AWS EBS CSI Driver

[AWS EBS CSI Driver Documentation](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)

---

# PostgreSQL Images

## PostgreSQL Kubernetes Deployment Examples

![PostgreSQL Kubernetes](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*JxRDg7s89hGkw_ghH9PWtw.png)

![Bitnami PostgreSQL](hhttps://miro.medium.com/v2/resize:fit:1400/format:webp/1*ScatetN5BZTzduvWMlVY6A.jpeg)

---

# Prerequisites

- Kubernetes Cluster
- Helm installed
- AWS EBS CSI Driver installed
- `kubectl` configured
- StorageClass configured for dynamic provisioning

---

# 1. Add Bitnami Helm Repository

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

---

# 2. Create PostgreSQL Namespace

```bash
kubectl create namespace postgres
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

## Check Pods

```bash
kubectl get pods -n postgres
```

---

## Check Services

```bash
kubectl get svc -n postgres
```

---

## Check Persistent Volume Claims

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

---

## Retrieve PostgreSQL Password

```bash
PGPASSWORD=$(kubectl get secret --namespace postgres postgres-secret -o jsonpath="{.data.password}" | base64 -d)
```

---

## Connect to PostgreSQL Database

```bash
psql -h postgres-postgresql \
  -U appuser \
  -d appdb
```

---

# 8. Verify Persistent Storage

## Check PVC

```bash
kubectl get pvc -n postgres
```

---

## Check PV

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

# 10. Restart PostgreSQL StatefulSet

```bash
kubectl rollout restart statefulset postgres-postgresql -n postgres
```

---

# 11. View PostgreSQL Logs

```bash
kubectl logs -f postgres-postgresql-0 -n postgres
```

---

# 12. Uninstall PostgreSQL

```bash
helm uninstall postgres -n postgres
```

---

# 13. Cleanup Persistent Volumes (Optional)

```bash
kubectl delete pvc --all -n postgres
```

> Warning: This permanently deletes PostgreSQL data.

---

# Useful Commands

## Get All PostgreSQL Resources

```bash
kubectl get all -n postgres
```

---

## Describe PostgreSQL Pod

```bash
kubectl describe pod postgres-postgresql-0 -n postgres
```

---

## Exec into PostgreSQL Pod

```bash
kubectl exec -it postgres-postgresql-0 -n postgres -- bash
```

---

## Check Helm Releases

```bash
helm list -n postgres
```

---

# Troubleshooting

## Pod Stuck in Pending State

Check:

```bash
kubectl describe pod <pod-name> -n postgres
kubectl get storageclass
kubectl get pvc -n postgres
```

---

## PVC Not Binding

Verify:

- EBS CSI Driver installed
- Default StorageClass configured
- IAM permissions for EBS CSI Driver
- Node availability in target AZ

---

## PostgreSQL Connection Issues

Check:

```bash
kubectl get svc -n postgres
kubectl logs -f postgres-postgresql-0 -n postgres
```

Verify:

- Username/password
- Service name
- Namespace
- Network policies

---

# Recommended Production Enhancements

- Enable backups using Velero or pgBackRest
- Configure replication/high availability
- Use external secret management
- Enable monitoring using Prometheus + Grafana
- Configure resource requests and limits
- Enable TLS for PostgreSQL connections
- Use dedicated StorageClass with optimized IOPS

---

# Useful Official Documentation

- [Bitnami PostgreSQL Helm Chart](https://github.com/bitnami/charts/tree/main/bitnami/postgresql)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [AWS EBS CSI Driver](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)