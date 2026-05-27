# ArgoCD + Argo Rollouts Setup on Kubernetes

This guide installs ArgoCD and Argo Rollouts on a Kubernetes cluster and exposes them using ingress resources.

---

# Architecture Overview

ArgoCD and Argo Rollouts work together for GitOps-based continuous delivery and progressive deployments.

* **ArgoCD** → GitOps continuous delivery tool
* **Argo Rollouts** → Progressive delivery (Canary / Blue-Green deployments)
* **Ingress Controller** → Exposes dashboards externally
* **Rollout Extension** → Adds Rollouts UI inside ArgoCD

---

# Public References

## ArgoCD

[ArgoCD Official Documentation](https://argo-cd.readthedocs.io)

## Argo Rollouts

[Argo Rollouts Official Documentation](https://argo-rollouts.readthedocs.io)

## Rollouts Extension

[Rollout Extension GitHub Repository](https://github.com/argoproj-labs/rollout-extension)

---

# Public Images

## ArgoCD UI

## Argo Rollouts UI

---

# Prerequisites

* Running Kubernetes cluster
* `kubectl` configured with cluster access
* Ingress controller already installed (AWS ALB / NGINX or equivalent)
* DNS configured for ingress hostnames
* ArgoCD CLI installed

---

# ArgoCD Installation

## Create Namespace

```bash
kubectl create namespace argocd
```

---

## Apply ArgoCD Manifests

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

---

## Apply Ingress Configuration

```bash
kubectl apply -f ingress.yaml -n argocd
```

---

## Enable Insecure Mode for ArgoCD Server

Required when ingress handles TLS termination.

```bash
kubectl patch configmap argocd-cmd-params-cm \
-n argocd \
--type merge \
-p '{"data":{"server.insecure":"true"}}'
```

---

## Configure ArgoCD RBAC

### Edit RBAC ConfigMap

```bash
kubectl edit configmap argocd-rbac-cm -n argocd
```

Example ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"ConfigMap","metadata":{"annotations":{},"labels":{"app.kubernetes.io/name":"argocd-rbac-cm","app.kubernetes.io/part-of":"argocd"},"name":"argocd-rbac-cm","namespace":"argocd"}}
  creationTimestamp: "2026-05-26T20:35:53Z"
  labels:
    app.kubernetes.io/name: argocd-rbac-cm
    app.kubernetes.io/part-of: argocd
  name: argocd-rbac-cm
  namespace: argocd
  resourceVersion: "26364"
  uid: e8b3c186-c1b4-462a-a709-e2dfa77f0e62
```

---

## Restart ArgoCD Server Deployment

Required after updating RBAC or ArgoCD config.

```bash
kubectl rollout restart deployment argocd-server -n argocd
```

---

## Login to ArgoCD CLI

```bash
argocd login argo-cu.dealshare.in:80 \
  --username <user> \
  --password <pass> \
  --plaintext \
  --grpc-web \
  --skip-test-tls
```

---

# Argo Rollouts Installation

## Create Namespace

```bash
kubectl create namespace argo-rollouts
```

---

## Install Argo Rollouts

```bash
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```

---

## Install Rollouts Dashboard

```bash
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/dashboard-install.yaml
```

---

## Apply Ingress Configuration

```bash
kubectl apply -f rollout-ingress.yaml -n argo-rollouts
```

---

# Rollout Extension

Repository:

[Rollout Extension Repository](https://github.com/argoproj-labs/rollout-extension)

---

# Verification

## Verify ArgoCD Resources

```bash
kubectl get pods -n argocd
kubectl get svc -n argocd
kubectl get ingress -n argocd
```

---

## Verify Argo Rollouts Resources

```bash
kubectl get pods -n argo-rollouts
kubectl get svc -n argo-rollouts
kubectl get ingress -n argo-rollouts
```

---

# Useful Commands

## Get All Resources

```bash
kubectl get all -n argocd
kubectl get all -n argo-rollouts
```

---

## Check Logs

```bash
kubectl logs -f deployment/argocd-server -n argocd

kubectl logs -f deployment/argo-rollouts -n argo-rollouts
```

---

## Restart Deployments

```bash
kubectl rollout restart deployment argocd-server -n argocd

kubectl rollout restart deployment argo-rollouts -n argo-rollouts
```

---

# Access

After ingress and DNS configuration are completed:

## ArgoCD

```text
https://<your-argocd-domain>
```

---

## Argo Rollouts Dashboard

```text
https://<your-rollouts-domain>
```

---

# Troubleshooting

## ArgoCD UI Not Accessible

Check:

```bash
kubectl get ingress -n argocd
kubectl describe ingress <ingress-name> -n argocd
```

---

## ArgoCD Login Fails

Verify:

* DNS resolution
* Ingress rules
* TLS termination
* `server.insecure=true`
* ArgoCD server restarted successfully

---

## Rollouts Dashboard Not Loading

Check:

```bash
kubectl get pods -n argo-rollouts
kubectl logs deployment/argo-rollouts -n argo-rollouts
```

---

# Recommended Production Enhancements

* Enable SSO (GitHub / Google / Okta)
* Configure RBAC policies
* Enable Notifications
* Use External Secrets
* Integrate Prometheus + Grafana
* Use HA Redis for ArgoCD
* Configure Backup Strategy
* Enable Audit Logging

---

# Useful Official Documentation

* [ArgoCD Getting Started Guide](https://argo-cd.readthedocs.io/en/stable/getting_started/)
* [Argo Rollouts Canary Deployments](https://argo-rollouts.readthedocs.io/en/stable/features/canary/)
* [Argo Rollouts Blue Green Deployments](https://argo-rollouts.readthedocs.io/en/stable/features/bluegreen/)
