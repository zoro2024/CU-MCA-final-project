output "cluster-name" {
  value = module.dealshare_test
}

output "eks_sg" {
  value = module.eks_internal_ssh_security_group.sg_id
}