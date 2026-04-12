variable "db_connection_string" {
  type      = string
  sensitive = true
}

variable "acm_certificate_arn" {
  type    = string
  default = ""
}

variable "openai_api_key" {
  type      = string
  sensitive = true
  default   = ""
}
