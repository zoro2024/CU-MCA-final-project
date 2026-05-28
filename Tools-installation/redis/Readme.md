# Redis Installation Guide on Kubernetes using Bitnami Helm Chart (Without Authentication)

This guide explains how to deploy Redis on Kubernetes using the Bitnami Helm chart with persistent storage backed by AWS EBS gp3 volumes.

---

# Redis Architecture

- Redis deployed in standalone mode
- Redis authentication disabled
- Persistent storage backed by AWS EBS gp3
- Dynamic volume provisioning enabled through EBS CSI Driver
- Helm used for deployment and lifecycle management

---

# Public References

## Bitnami Redis Helm Chart

[Bitnami Redis Helm Chart](https://github.com/bitnami/charts/tree/main/bitnami/redis)

## Redis Official Documentation

[Redis Official Documentation](https://redis.io/docs/)

## Helm Documentation

[Helm Official Documentation](https://helm.sh/docs/)

## AWS EBS CSI Driver

[AWS EBS CSI Driver Documentation](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)

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

# 2. Create gp3 StorageClass

This StorageClass uses AWS EBS gp3 volumes and sets it as the default StorageClass.

```bash
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
parameters:
  type: gp3
EOF
```

---

# 3. Install Redis using Bitnami Helm Chart

This installation deploys Redis in standalone mode with authentication disabled.

```bash
helm install redis bitnami/redis \
  --namespace redis \
  --create-namespace \
  --set architecture=standalone \
  --set auth.enabled=false
```

---

# 4. Verify Installation

## Check Pods

```bash
kubectl get pods -n redis
```

---

## Check Services

```bash
kubectl get svc -n redis
```

---

# 5. Connect to Redis

## Run Redis Client Pod

```bash
kubectl run redis-client \
  --rm --tty -i \
  --restart='Never' \
  --namespace redis \
  --image docker.io/bitnami/redis:7.4 \
  -- bash
```

---

## Connect from Inside Pod

```bash
redis-cli -h redis-master
```

---

# 6. Verify Persistent Storage

## Check PVC

```bash
kubectl get pvc -n redis
```

---

## Check PV

```bash
kubectl get pv
```

---

# 7. Upgrade Redis

```bash
helm upgrade redis bitnami/redis \
  --namespace redis \
  --set architecture=standalone \
  --set auth.enabled=false
```

---

# 8. Restart Redis StatefulSet

```bash
kubectl rollout restart statefulset redis-master -n redis
```

---

# 9. View Redis Logs

```bash
kubectl logs -f redis-master-0 -n redis
```

---

# 10. Uninstall Redis

```bash
helm uninstall redis -n redis
```

---

# 11. Cleanup Persistent Volumes (Optional)

```bash
kubectl delete pvc --all -n redis
```

> Warning: This permanently deletes Redis data.

---

# Useful Commands

## Get All Redis Resources

```bash
kubectl get all -n redis
```

---

## Describe Redis Pod

```bash
kubectl describe pod redis-master-0 -n redis
```

---

## Exec into Redis Pod

```bash
kubectl exec -it redis-master-0 -n redis -- bash
```

---

## Check Helm Releases

```bash
helm list -n redis
```

---

# Troubleshooting

## Pod Stuck in Pending State

Check:

```bash
kubectl describe pod <pod-name> -n redis
kubectl get storageclass
kubectl get pvc -n redis
```

---

## PVC Not Binding

Verify:

- EBS CSI Driver installed
- Default StorageClass configured
- IAM permissions for EBS CSI Driver
- Node availability in target AZ

---

## Redis Connection Issues

Check:

```bash
kubectl get svc -n redis
kubectl logs -f redis-master-0 -n redis
```

Verify:

- Redis service name
- Namespace
- Network policies
- Redis pod health

---

# Recommended Production Enhancements

- Enable Redis authentication
- Configure Redis replication
- Enable Redis Sentinel
- Configure backups
- Integrate monitoring using Prometheus + Grafana
- Configure resource requests and limits
- Use dedicated StorageClass with optimized IOPS

---

# Useful Official Documentation

- [Bitnami Redis Helm Chart](https://github.com/bitnami/charts/tree/main/bitnami/redis)
- [Redis Documentation](https://redis.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [AWS EBS CSI Driver](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)