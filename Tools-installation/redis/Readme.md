# Redis Installation Guide on Kubernetes using Bitnami Helm Chart (Without Authentication)

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

Check pods:

```bash
kubectl get pods -n redis
```

Check services:

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

## Connect from inside pod

```bash
redis-cli -h redis-master
```

---

# 6. Verify Persistent Storage

Check PVC:

```bash
kubectl get pvc -n redis
```

Check PV:

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

# 8. Uninstall Redis

```bash
helm uninstall redis -n redis
```

---

# 9. Cleanup Persistent Volumes (Optional)

```bash
kubectl delete pvc --all -n redis
```

> Warning: This permanently deletes Redis data.

---

# Architecture

- Redis deployed in standalone mode
- Redis authentication disabled
- Persistent storage backed by AWS EBS gp3
- Dynamic volume provisioning enabled through EBS CSI Driver