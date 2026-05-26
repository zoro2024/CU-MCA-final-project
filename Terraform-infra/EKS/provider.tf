provider "aws" {
  region = var.region
  default_tags {
    tags = {
      "owner"      = "devops"
      "managed-by" = "terraform"
      "project"    = "dealshare"
    }

  }
}