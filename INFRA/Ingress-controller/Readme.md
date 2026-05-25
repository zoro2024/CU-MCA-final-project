# AWS Load Balancer Controller Setup on Amazon EKS

This guide explains how to install and configure the AWS Load Balancer Controller on an Amazon EKS cluster using IAM Roles for Service Accounts (IRSA).

---

## Prerequisites

Make sure the following tools are installed and configured:

- AWS CLI
- kubectl
- eksctl
- Helm

Also ensure:

- An EKS cluster already exists
- kubectl is connected to the cluster
- Required IAM permissions are available

---

# 1. Set Cluster Name

```bash
cluster_name=<your-cluster-name>
```

Example:

```bash
cluster_name=my-eks-cluster
```

---

# 2. Associate IAM OIDC Provider

Fetch the OIDC ID:

```bash
oidc_id=$(aws eks describe-cluster \
  --name $cluster_name \
  --query "cluster.identity.oidc.issuer" \
  --output text | cut -d '/' -f 5)

echo $oidc_id
```

Associate the IAM OIDC provider:

```bash
eksctl utils associate-iam-oidc-provider \
  --cluster $cluster_name \
  --approve
```

---

# 3. Download IAM Policy

```bash
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
```

---

# 4. Create IAM Policy

```bash
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json
```

---

# 5. Create IAM Service Account

Fetch AWS Account ID:

```bash
aws_account_id=$(aws sts get-caller-identity --query Account --output text)
```

Create the IAM service account:

```bash
eksctl create iamserviceaccount \
  --cluster=$cluster_name \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::$aws_account_id:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve
```

---

# 6. Tag Subnets

AWS Load Balancer Controller discovers subnets using tags.

## Public Subnets (Internet-facing ALB)

```bash
aws ec2 create-tags \
  --resources <public-subnet-id-1> <public-subnet-id-2> \
  --tags \
    Key=kubernetes.io/role/elb,Value=1 \
    Key=kubernetes.io/cluster/$cluster_name,Value=shared
```

## Private Subnets (Internal ALB)

```bash
aws ec2 create-tags \
  --resources <private-subnet-id-1> <private-subnet-id-2> \
  --tags \
    Key=kubernetes.io/role/internal-elb,Value=1 \
    Key=kubernetes.io/cluster/$cluster_name,Value=shared
```

---

# 7. Add Helm Repository

```bash
helm repo add eks https://aws.github.io/eks-charts

helm repo update
```

---

# 8. Fetch VPC ID Dynamically

```bash
vpc_id=$(aws eks describe-cluster \
  --name $cluster_name \
  --query "cluster.resourcesVpcConfig.vpcId" \
  --output text)

echo $vpc_id
```

---

# 9. Install AWS Load Balancer Controller

```bash
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$cluster_name \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=$(aws configure get region) \
  --set vpcId=$vpc_id
```

---

# 10. Verify Installation

Check deployment:

```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
```

Check pods:

```bash
kubectl get pods -n kube-system | grep aws-load-balancer-controller
```

---

# 11. Verify ALB Creation

Deploy an ingress resource and verify ALB creation:

```bash
kubectl get ingress
```

---

# Useful Commands

## View Controller Logs

```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

## Describe Ingress

```bash
kubectl describe ingress <ingress-name>
```

---

# Notes

- Minimum two subnets across different Availability Zones are recommended.
- Proper subnet tagging is mandatory.
- Security groups must allow required traffic.
- IRSA is recommended instead of attaching permissions directly to worker nodes.
- Public subnets are used for internet-facing ALBs.
- Private subnets are used for internal ALBs.

---