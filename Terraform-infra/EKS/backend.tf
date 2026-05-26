terraform {
  backend "s3" {
    bucket = "cu-project-final-terraform-state"
    key    = "eks/terraform.tfstate"
    region = "ap-south-1"
  }
}