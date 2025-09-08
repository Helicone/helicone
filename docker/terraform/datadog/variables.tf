variable "datadog_api_key" {
  type = string
}

variable "datadog_app_key" {
  type = string
}

variable "datadog_api_url" {
  description = "Datadog API base URL, e.g. https://api.us5.datadoghq.com"
  type        = string
}