# ArgoCD + Argo Rollouts Setup on Kubernetes

This guide installs ArgoCD and Argo Rollouts on a Kubernetes cluster and exposes them using ingress resources.

---

## Prerequisites

- Running Kubernetes cluster
- `kubectl` configured with cluster access
- Ingress controller already installed (AWS ALB / NGINX or equivalent)
- DNS configured for ingress hostnames

---

# ArgoCD Installation

### Create namespace

```bash
kubectl create namespace argocd
```

### Apply ArgoCD manifests

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Apply ingress configuration

```bash
kubectl apply -f ingress.yaml -n argocd
```

### Enable insecure mode for ArgoCD server

Required when ingress handles TLS termination.

```bash
kubectl patch configmap argocd-cmd-params-cm \
-n argocd \
--type merge \
-p '{"data":{"server.insecure":"true"}}'
```

### Restart ArgoCD server deployment

```bash
kubectl rollout restart deployment argocd-server -n argocd
```

---

# Argo Rollouts Installation

### Create namespace

```bash
kubectl create namespace argo-rollouts
```

### Install Argo Rollouts

```bash
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```

### Install Rollouts Dashboard

```bash
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/dashboard-install.yaml
```

### Apply ingress configuration

```bash
kubectl apply -f rollout-ingress.yaml -n argo-rollouts
```

---

# Rollout Extension

Repository:

https://github.com/argoproj-labs/rollout-extension

---

# Verification

## Verify ArgoCD resources

```bash
kubectl get pods -n argocd
kubectl get svc -n argocd
kubectl get ingress -n argocd
```

## Verify Argo Rollouts resources

```bash
kubectl get pods -n argo-rollouts
kubectl get svc -n argo-rollouts
kubectl get ingress -n argo-rollouts
```

---

# Useful Commands

### Get all resources

```bash
kubectl get all -n argocd
kubectl get all -n argo-rollouts
```

### Check logs

```bash
kubectl logs -f deployment/argocd-server -n argocd

kubectl logs -f deployment/argo-rollouts -n argo-rollouts
```

### Restart deployments

```bash
kubectl rollout restart deployment argocd-server -n argocd

kubectl rollout restart deployment argo-rollouts -n argo-rollouts
```

---

# Access

After ingress and DNS configuration are completed:

**ArgoCD**

```text
https://<your-argocd-domain>
```

**Argo Rollouts Dashboard**

```text
https://<your-rollouts-domain>
```