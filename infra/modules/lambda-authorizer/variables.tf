variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "cognito_user_pool_id" {
  type = string
}

variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "api_id" {
  type = string
}

variable "api_execution_arn" {
  type = string
}

variable "lambda_integration_id" {
  type = string
}
