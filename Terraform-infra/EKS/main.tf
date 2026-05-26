locals {
  common_tags                   = { "owner" : "Devops" }
  worker_group1_tags            = { "Name" : "worker-group-1" }
  cluster_endpoint_access_cidrs = ["0.0.0.0/0"]
  vpc_id                        = data.terraform_remote_state.vpc.outputs.vpc_id
  subnet_ids                    = data.terraform_remote_state.vpc.outputs.private_subnet_ids
  w1_subnet_ids                 = data.terraform_remote_state.vpc.outputs.private_subnet_ids
}

module "eks_internal_ssh_security_group" {
  #checkov:skip=CKV_TF_1:Ensure Terraform module sources use a commit hash
  source                             = "OT-CLOUD-KIT/security-groups/aws"
  version                            = "1.0.0"
  enable_whitelist_ip                = true
  enable_source_security_group_entry = true
  name_sg                            = var.eks_node_sg_name
  vpc_id                             = local.vpc_id
  ingress_rule = {
    rules = {
      rule_list = [
        {
          description  = "22 port "
          from_port    = 22
          to_port      = 22
          protocol     = "tcp"
          cidr         = ["172.0.0.0/16"]
          ipv6_cidr    = []
          source_SG_ID = []
          }, {
          description  = "Allow HTTP traffic "
          from_port    = 443
          to_port      = 443
          protocol     = "tcp"
          cidr         = ["172.0.0.0/16"]
          ipv6_cidr    = []
          source_SG_ID = []
        }
      ]
    }
  }
}

module "dealshare_test" {
  #checkov:skip=CKV_TF_1:Ensure Terraform module sources use a commit hash
  source                        = "./modules/eks"
  cluster_name                  = var.cluster_name
  eks_cluster_version           = var.eks_cluster_version
  subnets                       = local.subnet_ids
  tags                          = local.common_tags
  kubeconfig_name               = "config"
  config_output_path            = "config"
  eks_node_group_name           = var.eks_node_group_name
  region                        = var.region
  cluster_endpoint_whitelist    = true
  cluster_endpoint_access_cidrs = local.cluster_endpoint_access_cidrs
  create_node_group             = true
  endpoint_private              = true
  endpoint_public               = true
  k8s-spot-termination-handler  = false
  cluster_autoscaler            = false
  metrics_server                = false
  vpc_id                        = local.vpc_id
  eks_addons                    = var.eks_addons
  slackUrl                      = "slack_webhook_url"
  node_groups = {
    "worker-project" = {
      subnets            = local.w1_subnet_ids
      ssh_key            = var.ssh_key
      security_group_ids = [module.eks_internal_ssh_security_group.sg_id]
      instance_type      = var.w1_instance_type
      ami_type           = var.w1_ami_type
      desired_capacity   = var.w1_desired_capacity
      disk_size          = var.w1_disk_size
      max_capacity       = var.w1_max_capacity
      min_capacity       = var.w1_min_capacity
      capacity_type      = var.w1_capacity_type
      tags               = merge(local.common_tags, local.worker_group1_tags)
      labels             = { "project" : "MCA-final", "env" : "CU-Project", "type" : "ON-DEMAND" }
      taints             = []
    }
  }
}