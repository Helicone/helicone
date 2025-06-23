terraform {
  cloud { 
    organization = "helicone" 

    workspaces { 
      name = "helicone-ecr" 
    } 
  }

  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.67"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ECR Repositories
resource "aws_ecr_repository" "web" {
  name                 = "helicone/web"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "jawn" {
  name                 = "helicone/jawn"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "migrations" {
  name                 = "helicone/migrations"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "aigateway" {
  name                 = "helicone/ai-gateway"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Output the repository URLs
output "web_repository_url" {
  value = aws_ecr_repository.web.repository_url
}

output "jawn_repository_url" {
  value = aws_ecr_repository.jawn.repository_url
} 

output "migrations_repository_url" {
  value = aws_ecr_repository.migrations.repository_url
}

output "aigateway_repository_url" {
  value = aws_ecr_repository.aigateway.repository_url
}