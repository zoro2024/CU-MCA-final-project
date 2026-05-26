data "terraform_remote_state" "vpc" {
  backend = "s3"

  config = {
    bucket = "cu-project-final-terraform-state"
    key    = "network/terraform.tfstate"
    region = "ap-south-1"
  }
}