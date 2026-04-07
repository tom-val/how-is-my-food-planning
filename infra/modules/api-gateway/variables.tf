variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "lambda_invoke_arn" {
  type = string
}

variable "cors_allow_origins" {
  type    = list(string)
  default = []
}

variable "authorizer_id" {
  type    = string
  default = null
}

variable "throttle_rate_limit" {
  type    = number
  default = 10
}

variable "throttle_burst_limit" {
  type    = number
  default = 25
}
