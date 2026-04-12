variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "db_connection_string" {
  type      = string
  sensitive = true
}

variable "api_lambda_role_name" {
  type = string
}
