terraform {
  backend "s3" {
    bucket = "cu-project-final-terraform-state"
    key    = "network/terraform.tfstate"
    region = "ap-south-1"
  }
}
