terraform {
  cloud { 
    organization = "helicone" 

    workspaces { 
      name = "helicone" 
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

# Output the repository URLs
output "worker_repository_url" {
  value = aws_ecr_repository.worker.repository_url
}

output "web_repository_url" {
  value = aws_ecr_repository.web.repository_url
}

output "web_dev_repository_url" {
  value = aws_ecr_repository.web_dev.repository_url
}

output "supabase_migration_runner_repository_url" {
  value = aws_ecr_repository.supabase_migration_runner.repository_url
}

output "clickhouse_migration_runner_repository_url" {
  value = aws_ecr_repository.clickhouse_migration_runner.repository_url
}

output "jawn_repository_url" {
  value = aws_ecr_repository.jawn.repository_url
} 