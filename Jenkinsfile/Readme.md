
# Jenkins Pipeline Setup for Application Deployment

This guide explains how to configure and use the Jenkins pipeline for deploying applications using:

- Jenkins
- Docker
- AWS ECR
- ArgoCD
- Helm
- Kubernetes
- Argo Rollouts
- SonarQube
- Trivy
- Gitleaks

## Architecture Overview


GitHub → Jenkins → Gitleaks Scan → SonarQube Analysis → Docker Build → Trivy Scan → AWS ECR → Helm Values Update → Git Push → ArgoCD Sync → Kubernetes Deployment


## Prerequisites

Make sure the following are configured:

* Jenkins installed
* Docker installed on Jenkins agent
* AWS CLI configured
* ArgoCD CLI installed on Jenkins server
* GitHub repository access configured
* ArgoCD configured and connected to cluster
* Kubernetes cluster running
* AWS ECR repository exists
* SonarQube server configured
* Sonar Scanner configured in Jenkins

## Required Jenkins Plugins

Install the following Jenkins plugins:

* Git Plugin
* Credentials Binding Plugin
* Pipeline Plugin
* Workspace Cleanup Plugin
* Docker Pipeline Plugin
* SonarQube Scanner Plugin

## Security & Code Quality Tools

| Tool      | Purpose                                 |
| --------- | --------------------------------------- |
| Gitleaks  | Detects hardcoded secrets               |
| SonarQube | Performs static code analysis           |
| Trivy     | Scans Docker images for vulnerabilities |

## One-Time Jenkins Server Setup

### Install Trivy

Follow the official [Trivy installation documentation](https://trivy.dev/docs/latest/getting-started/installation/).

### Install Gitleaks

Follow the [Gitleaks installation guide for Ubuntu](https://lindevs.com/install-gitleaks-on-ubuntu).

## Configure SonarQube in Jenkins

### Step 1 — Install SonarQube Plugin

Go to:

```text
Manage Jenkins → Plugins
```

Install:

```text
SonarQube Scanner Plugin
```

### Step 2 — Configure SonarQube Server

Go to:

```text
Manage Jenkins → System
```

Find:

```text
SonarQube Servers
```

Add:

| Field                | Example                        |
| -------------------- | ------------------------------ |
| Name                 | prod-sonarqube                 |
| Server URL           | http://<sonarqube-server>:9000 |
| Authentication Token | sonar-token                    |

### Step 3 — Configure Sonar Scanner Tool

Go to:

```text
Manage Jenkins → Tools
```

Find:

```text
SonarQube Scanner
```

Add:

| Field   | Example        |
| ------- | -------------- |
| Name    | prod-sonarqube |
| Version | Latest         |

This name must match the pipeline configuration:

```groovy
SONAR_SCANNER_HOME = tool 'prod-sonarqube'
```

## Jenkins Credentials Configuration

Go to:

```text
Jenkins Dashboard → Manage Jenkins → Credentials
```

Create the following credentials.

### 1. GitHub Credentials

#### Credential Type

```text
Username with password
```

#### Credential ID

```text
github-credentials
```

### Example Values

| Field    | Value                        |
| -------- | ---------------------------- |
| Username | github-username              |
| Password | github-personal-access-token |

### 2. ArgoCD Server

#### Credential Type

```text
Secret text
```

#### Credential ID

```text
ARGOCD_SERVER
```

#### Example Value

```text
argocd.example.com:80
```

### 3. ArgoCD Username

#### Credential Type

```text
Secret text
```

#### Credential ID

```text
ARGO_USER
```

#### Example Value

```text
admin
```

### 4. ArgoCD Password

#### Credential Type

```text
Secret text
```

#### Credential ID

```text
ARGO_PASS
```

#### Example Value

```text
your-argocd-password
```

## Jenkins Pipeline Variables

| Variable           | Description                |
| ------------------ | -------------------------- |
| APP_NAME           | Application name           |
| AWS_REGION         | AWS region                 |
| AWS_ACCOUNT_ID     | AWS account ID             |
| ECR_REPO           | ECR repository name        |
| REGISTRY           | AWS ECR registry           |
| ECR_URI            | Full ECR image URI         |
| APP_PATH           | Docker build path          |
| HELM_PATH          | Helm chart path            |
| GIT_REPO           | GitHub repository          |
| GIT_CREDENTIALS    | Jenkins Git credentials ID |
| ARGOCD_APP_NAME    | ArgoCD application name    |
| SONAR_SCANNER_HOME | Sonar Scanner tool         |

## Example Environment Variables

```groovy
environment {
    APP_NAME = "application-name"
    AWS_REGION = "ap-south-1"
    AWS_ACCOUNT_ID = "<aws-account-id>"
    ECR_REPO = "project/application-name"
    REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    ECR_URI = "${REGISTRY}/${ECR_REPO}"
    APP_PATH = "Application/backend"
    HELM_PATH = "Application/helm/backend"
    GIT_REPO = "https://github.com/<github-user>/<repository>.git"
    GIT_CREDENTIALS = "github-credentials"
    ARGOCD_APP_NAME = "application-name"
    SONAR_SCANNER_HOME = tool 'prod-sonarqube'
}
```

## Deployment Types

### 1. Canary Rollout

This mode:

* Pulls latest code
* Runs Gitleaks scan
* Runs SonarQube analysis
* Builds Docker image
* Runs Trivy image scan
* Pushes image to ECR
* Updates Helm values
* Triggers ArgoCD sync

### 2. Rollout Existing Tag

This mode:

* Uses existing Docker image tag
* Skips Docker build
* Updates Helm values
* Triggers ArgoCD sync

## Jenkins Pipeline Parameters

| Parameter    | Description        |
| ------------ | ------------------ |
| DEPLOY_TYPE  | Deployment mode    |
| BRANCH_NAME  | Git branch         |
| ROLL_OUT_TAG | Existing image tag |

## Example Parameters

| Parameter    | Example        |
| ------------ | -------------- |
| DEPLOY_TYPE  | Canary Rollout |
| BRANCH_NAME  | main           |
| ROLL_OUT_TAG | v1.0.2         |

## Pipeline Security Stages

### 1. Gitleaks Scan

Detects:

* Hardcoded passwords
* API keys
* Tokens
* Secrets

Report generated:

```text
gitleaks-report.json
```

### 2. SonarQube Analysis

Performs:

* Static code analysis
* Code smell detection
* Bug detection
* Security issue detection
* Quality gate checks

### 3. Trivy Image Scan

Scans Docker image for:

* OS package vulnerabilities
* Critical CVEs
* High severity vulnerabilities

Report generated:

```text
trivy-report.html
```

## How Deployment Works

### Step 1 — Checkout Code

Pipeline clones repository from GitHub.

### Step 2 — Generate Image Tag

Example generated tag:

```text
a1b2c3d-25
```

Format:

```text
<git-commit-short-hash>-<build-number>
```

### Step 3 — Run Gitleaks Scan

Pipeline scans the repository for hardcoded secrets.

### Step 4 — Run SonarQube Analysis

Pipeline performs static code analysis using SonarQube.

### Step 5 — Login to AWS ECR

Pipeline authenticates Docker with AWS ECR.

```bash
aws ecr get-login-password --region <aws-region> | \
docker login --username AWS --password-stdin <ecr-registry>
```

### Step 6 — Build Docker Image

Pipeline builds Docker image from application directory.

### Step 7 — Run Trivy Image Scan

Pipeline scans Docker image vulnerabilities and generates HTML report.

### Step 8 — Push Docker Image

Docker image pushed to ECR repository.

### Step 9 — Update Helm Values

Pipeline updates:

```text
values.yaml
```

Example:

```yaml
tag: "a1b2c3d-25"
```

### Step 10 — Push Changes to GitHub

Pipeline commits updated Helm values and pushes to GitHub.

### Step 11 — Sync ArgoCD

```bash
argocd login <argocd-server> \
  --username <user> \
  --password <password> \
  --plaintext \
  --grpc-web \
  --skip-test-tls
```

```bash
argocd app sync <argocd-app-name>
```

### Step 12 — Wait for Deployment Health

Pipeline waits until deployment becomes healthy.

## Automatic Rollback

If deployment fails:

* Git commit automatically reverted
* Helm values rollback triggered
* ArgoCD sync executed again
