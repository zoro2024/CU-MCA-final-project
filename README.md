# LogLens — MCA Final Project

![alt text](<Screenshot from 2026-05-28 06-00-35.png>)

🎓 **MCA Final Semester Project (Chandigarh University)**

- **Project:** LogLens — AI-assisted log analysis (FastAPI backend + React frontend).
- **Author:** Akshit Kapil
- **Purpose:** Help developers quickly understand error meanings, surface likely root causes, and provide suggested fixes.

🚀 Quick overview

LogLens analyzes raw application logs, summarizes error patterns, assigns severity, and suggests prioritized remediation steps. Results are stored for searching and auditing.

📁 Where to look

- Application README and developer docs: [Application/README.md](Application/README.md)
- Helm snippets and ingress guidance: [Application/helm/README.md](Application/helm/README.md)
- Kubernetes manifests (including ArgoCD apps): [Application/k8s/](Application/k8s/)
- Secret template (update and apply): [Application/k8s/loglens-secret.yaml](Application/k8s/loglens-secret.yaml)
- Tools install guides (Postgres, Redis, metrics, etc.): [Tools-installation/](Tools-installation/)
- Terraform infra code: [Terraform-infra/](Terraform-infra/)

📦 I deployed this to AWS — how you can do the same

1. Provision infrastructure (VPC, EKS, IAM) using the Terraform code in `Terraform-infra/`. Adjust variables to match your account and region.
2. Install platform tools (in this order):
   - Ingress controller (ALB/NGINX)
   - Argo CD
   - Postgres (follow `Tools-installation/postgres/Readme.md`)
   - Redis (follow `Tools-installation/redis/Readme.md`)
   - Metrics stack (if desired) — see `Tools-installation/Metric/Readme.md`

3. Create/update application secrets: edit `Application/k8s/loglens-secret.yaml` and apply:

```bash
kubectl -n loglens apply -f Application/k8s/loglens-secret.yaml
kubectl -n loglens rollout restart deployment loglens-backend
```

4. Register the apps in ArgoCD by applying the ArgoCD application manifests:

```bash
kubectl apply -f Application/k8s/argocd-application-backend.yaml
kubectl apply -f Application/k8s/argocd-application-frontend.yaml
```

5. Build and push container images (required): build backend and frontend images and push them to your container registry, then reference those images in Helm values or manifests. Example:

```bash
docker build -t <registry>/loglens-backend:TAG Application/backend
docker push <registry>/loglens-backend:TAG

docker build -t <registry>/loglens-frontend:TAG Application/frontend
docker push <registry>/loglens-frontend:TAG
```

6. (Optional) CI/CD: the repository contains Jenkinsfiles — update variables in the Jenkinsfile(s) and run your pipeline from your Jenkins instance (see `Jenkinsfile/` folders). You can automate the image build/push and Helm upgrades via CI.

Deployment option note: you can deploy the application using Helm charts (`Application/helm`) or the raw Kubernetes manifests under `Application/k8s/` (`k8s/backend`, `k8s/frontend`). Choose the approach that fits your workflow and update image references/values accordingly.

🔧 Notes & recommendations

- The repo defaults to AWS ALB ingress annotations; change the ingress class/annotations if you use a different controller (see `Application/helm/README.md`).
- For production, do NOT store plaintext secrets in `values.yaml` or repo. Use ExternalSecrets, SOPS, or SealedSecrets.
- If you manage secrets via GitOps, commit an encrypted `Application/k8s/loglens-secret.yaml` and let your GitOps controller apply it.

📞 Need help?

---
Created by Akshit Kapil — MCA Final Semester, Chandigarh University 🎓
