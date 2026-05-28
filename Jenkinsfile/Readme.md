# Jenkins CI/CD Pipeline Setup for Application Deployment

This guide explains how to configure and use the Jenkins pipeline for deploying applications using:

- Jenkins
- Docker
- AWS ECR
- ArgoCD
- Helm
- Kubernetes
- Argo Rollouts

---

# Architecture Overview

Flow:

```text
GitHub → Jenkins → Docker Build → AWS ECR → Helm Values Update → Git Push → ArgoCD Sync → Kubernetes Deployment
```

---

# Prerequisites

Make sure the following are configured:

- Jenkins installed
- Docker installed on Jenkins agent
- AWS CLI configured
- ArgoCD CLI installed on Jenkins server
- GitHub repository access configured
- ArgoCD configured and connected to cluster
- Kubernetes cluster running
- AWS ECR repository exists

---

# Required Jenkins Plugins

Install the following Jenkins plugins:

- Git Plugin
- Credentials Binding Plugin
- Pipeline Plugin
- Workspace Cleanup Plugin
- Docker Pipeline Plugin

---

# Jenkins Credentials Configuration

Go to:

```text
Jenkins Dashboard → Manage Jenkins → Credentials
```

Create the following credentials.

---

# 1. GitHub Credentials

## Credential Type

```text
Username with password
```

## Credential ID

```text
github-credentials
```

## Example Values

| Field | Value |
|---|---|
| Username | github-username |
| Password | github-personal-access-token |

---

# 2. ArgoCD Server

## Credential Type

```text
Secret text
```

## Credential ID

```text
ARGOCD_SERVER
```

## Example Value

```text
argocd.example.com:80
```

---

# 3. ArgoCD Username

## Credential Type

```text
Secret text
```

## Credential ID

```text
ARGO_USER
```

## Example Value

```text
admin
```

---

# 4. ArgoCD Password

## Credential Type

```text
Secret text
```

## Credential ID

```text
ARGO_PASS
```

## Example Value

```text
your-argocd-password
```

---

# Required AWS Permissions

The Jenkins server/user should have permissions for:

- ECR Push/Pull
- EKS Access
- IAM Read Access
- STS Access

Minimum services:

- ECR
- EKS
- EC2
- STS

---

# Create ECR Repository

Example:

```bash
aws ecr create-repository \
  --repository-name project/application-name \
  --region <aws-region>
```

---

# Jenkins Pipeline Variables

The pipeline uses the following environment variables:

| Variable | Description |
|---|---|
| APP_NAME | Application name |
| AWS_REGION | AWS region |
| AWS_ACCOUNT_ID | AWS account ID |
| ECR_REPO | ECR repository name |
| REGISTRY | AWS ECR registry |
| ECR_URI | Full ECR image URI |
| APP_PATH | Docker build path |
| HELM_PATH | Helm chart path |
| GIT_REPO | GitHub repository |
| GIT_CREDENTIALS | Jenkins Git credentials ID |
| ARGOCD_APP_NAME | ArgoCD application name |

---

# Example Environment Variables

```groovy
environment {

    APP_NAME        = "application-name"
    AWS_REGION      = "ap-south-1"
    AWS_ACCOUNT_ID  = "<aws-account-id>"

    ECR_REPO        = "project/application-name"

    REGISTRY        = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

    ECR_URI         = "${REGISTRY}/${ECR_REPO}"

    APP_PATH        = "Application/backend"

    HELM_PATH       = "Application/helm/backend"

    GIT_REPO        = "https://github.com/<github-user>/<repository>.git"

    GIT_CREDENTIALS = "github-credentials"

    ARGOCD_APP_NAME = "application-name"
}
```

---

# Deployment Types

The pipeline supports two deployment modes.

---

# 1. Canary Rollout

This mode:

- Pulls latest code
- Builds Docker image
- Pushes image to ECR
- Updates Helm values
- Triggers ArgoCD sync

---

# 2. Rollout Existing Tag

This mode:

- Uses existing Docker image tag
- Skips Docker build
- Updates Helm values
- Triggers ArgoCD sync

---

# Jenkins Pipeline Parameters

| Parameter | Description |
|---|---|
| DEPLOY_TYPE | Deployment mode |
| BRANCH_NAME | Git branch |
| ROLL_OUT_TAG | Existing image tag |

---

# Example Parameters

| Parameter | Example |
|---|---|
| DEPLOY_TYPE | Canary Rollout |
| BRANCH_NAME | main |
| ROLL_OUT_TAG | v1.0.2 |

---

# How Deployment Works

---

# Step 1 — Checkout Code

Pipeline clones repository from GitHub.

---

# Step 2 — Generate Image Tag

Example generated tag:

```text
a1b2c3d-25
```

Format:

```text
<git-commit-short-hash>-<build-number>
```

---

# Step 3 — Login to AWS ECR

Pipeline authenticates Docker with AWS ECR.

Command used:

```bash
aws ecr get-login-password --region <aws-region> | \
docker login --username AWS --password-stdin <ecr-registry>
```

---

# Step 4 — Build Docker Image

Pipeline builds Docker image from application directory.

---

# Step 5 — Push Docker Image

Docker image pushed to ECR repository.

---

# Step 6 — Update Helm Values

Pipeline updates:

```text
values.yaml
```

Example:

```yaml
tag: "a1b2c3d-25"
```

---

# Step 7 — Push Changes to GitHub

Pipeline commits updated Helm values and pushes to GitHub.

---

# Step 8 — Sync ArgoCD

Pipeline executes:

```bash
argocd login <argocd-server> \
  --username <user> \
  --password <password> \
  --plaintext \
  --grpc-web \
  --skip-test-tls
```

Then:

```bash
argocd app sync <argocd-app-name>
```

---

# Step 9 — Wait for Deployment Health

Pipeline waits until deployment becomes healthy.

---

# Automatic Rollback

If deployment fails:

- Git commit automatically reverted
- Helm values rollback triggered
- ArgoCD sync executed again

This provides automatic GitOps rollback.

---

# Jenkins Pipeline Setup

---

# 1. Create Pipeline Job

Go to:

```text
Jenkins Dashboard → New Item
```

Select:

```text
Pipeline
```

---

# 2. Configure Git Repository

Repository:

```text
https://github.com/<github-user>/<repository>.git
```

Branch:

```text
main
```

---

# 3. Add Jenkinsfile

Add your Jenkins pipeline script inside:

```text
Jenkinsfile
```

---

# ArgoCD Requirements

ArgoCD application should already exist.

Example:

```bash
argocd app list
```

Verify app:

```text
<application-name>
```

---

# Required Tools on Jenkins Agent

Install:

- Docker
- AWS CLI
- kubectl
- argocd CLI
- git

---

# Verify Docker Access

```bash
docker ps
```

---

# Verify AWS Access

```bash
aws sts get-caller-identity
```

---

# Verify ArgoCD Access

```bash
argocd version
```

---

# Useful Commands

---

# View Jenkins Workspace

```bash
pwd
ls -la
```

---

# View Docker Images

```bash
docker images
```

---

# Check ECR Images

```bash
aws ecr list-images \
  --repository-name <repository-name>
```

---

# Check ArgoCD App Status

```bash
argocd app get <application-name>
```

---

# Sync ArgoCD App Manually

```bash
argocd app sync <application-name>
```

---

# Restart Jenkins

```bash
sudo systemctl restart jenkins
```

---

# Troubleshooting

---

# Docker Permission Denied

Fix:

```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

---

# ArgoCD Login Failed

Verify:

- ArgoCD server reachable
- Correct credentials configured
- `--grpc-web` enabled
- `server.insecure=true` configured in ArgoCD

---

# ECR Push Failed

Verify:

- AWS credentials configured
- ECR repository exists
- IAM permissions available

---

# ArgoCD Sync Failed

Check:

```bash
argocd app get <application-name>
```

And:

```bash
kubectl get pods -A
```


