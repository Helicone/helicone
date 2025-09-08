terraform {
  required_version = ">= 1.3.0"

  required_providers {
    datadog = {
      source  = "DataDog/datadog"
      version = ">= 3.40.0"
    }
  }
  cloud {
    organization = "helicone"
    workspaces {
      name = "helicone-datadog"
    }
  }
}

provider "datadog" {
  api_key = var.datadog_api_key
  app_key = var.datadog_app_key
  api_url = var.datadog_api_url
}
