# VPC Module
# Placeholder — configure VPC, subnets, NAT gateways, etc.

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}
