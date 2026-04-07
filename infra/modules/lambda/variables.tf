variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "db_connection_string" {
  type      = string
  sensitive = true
}

variable "api_gateway_execution_arn" {
  type = string
}

variable "cors_allowed_origins" {
  type    = list(string)
  default = []
}
