terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "intentgraph-terraform-state"
    key            = "infra/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "intentgraph-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "IntentGraph"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# ─── Modules ──────────────────────────────────────
module "vpc" {
  source = "./modules/vpc"
  # vpc_cidr = "10.0.0.0/16"
  # environment = var.environment
}

module "eks" {
  source = "./modules/eks"
  # cluster_name = "intentgraph-${var.environment}"
  # depends_on   = [module.vpc]
}

module "rds" {
  source = "./modules/rds"
  # instance_class = "db.t3.medium"
  # depends_on     = [module.vpc]
}

module "redis" {
  source = "./modules/redis"
  # node_type  = "cache.t3.micro"
  # depends_on = [module.vpc]
}

module "s3" {
  source = "./modules/s3"
  # bucket_prefix = "intentgraph-${var.environment}"
}
