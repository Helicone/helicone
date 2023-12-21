//main.tf

provider "aws" {
  region = local.region
}

data "aws_availability_zones" "available" {}

locals {
  name   = "helicone-be"
  region = "us-west-2"
  database_name = "helicone"

  vpc_cidr = "10.11.0.0/16"
  azs      = slice(data.aws_availability_zones.available.names, 0, 3)

  tags = {
    Example    = local.name
    GithubRepo = "terraform-aws-rds-aurora"
    GithubOrg  = "terraform-aws-modules"
  }
}

################################################################################
# RDS Aurora Module
################################################################################

module "aurora" {
  source = "terraform-aws-modules/rds-aurora/aws"


  database_name = local.database_name

  name            = local.name
  engine          = "aurora-postgresql"
  engine_version  = "15.4"
  master_username = "root"
  storage_type    = "aurora-iopt1"
  storage_encrypted   = true
  instance_class  = "db.r6g.2xlarge" 
  monitoring_interval = 60
  backup_retention_period = 7
  preferred_backup_window = "03:00-06:00"
  preferred_maintenance_window = "Sat:06:00-Sat:09:00"
  instances = {
    one = {}
    two = {
      identifier     = "static-member-1"
      instance_class = "db.r6g.2xlarge"
    }
  }
  autoscaling_enabled      = true
  autoscaling_min_capacity = 1
  autoscaling_max_capacity = 5
  allow_major_version_upgrade = true

  endpoints = {
    static = {
      identifier     = "static-custom-endpt"
      type           = "ANY"
      static_members = ["static-member-1"]
      tags           = { Endpoint = "static-members" }
    }
  }

  vpc_id               = module.vpc.vpc_id
  db_subnet_group_name = module.vpc.database_subnet_group_name
  security_group_rules = {
    vpc_ingress = {
      cidr_blocks = module.vpc.private_subnets_cidr_blocks
    }
  }

  apply_immediately   = true
  skip_final_snapshot = true

  create_db_cluster_parameter_group      = true
  db_cluster_parameter_group_name        = local.name
  db_cluster_parameter_group_family      = "aurora-postgresql15"
  db_cluster_parameter_group_description = "${local.name} example cluster parameter group"
  db_cluster_parameter_group_parameters = [
    {
      name         = "log_min_duration_statement"
      value        = 4000
      apply_method = "immediate"
      },
      {
      name         = "rds.force_ssl"
      value        = 1
      apply_method = "immediate"
    }
  ]

  create_db_parameter_group      = true
  db_parameter_group_name        = local.name
  db_parameter_group_family      = "aurora-postgresql15"
  db_parameter_group_description = "${local.name} example DB parameter group"
  db_parameter_group_parameters = [
    {
      name         = "log_min_duration_statement"
      value        = 4000
      apply_method = "immediate"
    }
  ]

  enabled_cloudwatch_logs_exports = ["postgresql"]
  create_cloudwatch_log_group     = true

  create_db_cluster_activity_stream     = true
  db_cluster_activity_stream_kms_key_id = module.kms.key_id
  db_cluster_activity_stream_mode       = "async"

  tags = local.tags
}

################################################################################
# Supporting Resources
################################################################################

resource "aws_instance" "bastion_host" {
  ami                    = "ami-0efcece6bed30fd98" # Ubuntu 20.04
  instance_type          = "t2.micro"
  key_name               = var.jump_host_key
  vpc_security_group_ids = [aws_security_group.bastion_sg.id]
  subnet_id              = module.vpc.public_subnets[0]
  associate_public_ip_address = true

  tags = {
    Name = "${local.name}-bastion"
  }
}

resource "aws_security_group" "bastion_sg" {
  name        = "${local.name}-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.jump_cidr_blocks]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = local.name
  cidr = local.vpc_cidr

  azs              = local.azs
  public_subnets   = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k)]
  private_subnets  = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 3)]
  database_subnets = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 6)]

  tags = local.tags
}

# Create an EIP for each NAT Gateway
resource "aws_eip" "nat" {
  count = length(module.vpc.private_subnets)

  domain   = "vpc"

  tags = {
    Name = "${local.name}-nat-${count.index}-${local.azs[count.index]}"
  }
}

# Create a NAT Gateway for each private subnet
resource "aws_nat_gateway" "private_nat" {
  for_each = { for idx, subnet_id in module.vpc.public_subnets : idx => subnet_id }

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = each.value
  connectivity_type = "public"

  tags = {
    Name = "${local.name}-nat-gateway-${each.key}-${local.azs[each.key]}"
  }
}

# Assuming you have route tables for each private subnet
# Update routes for each private route table to use the respective NAT Gateway
resource "aws_route" "private_nat_route" {
  for_each = { for idx, rt_id in module.vpc.private_route_table_ids : idx => rt_id }

  route_table_id         = each.value
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.private_nat[each.key].id
}

module "kms" {
  source  = "terraform-aws-modules/kms/aws"
  version = "~> 2.0"

  description             = "KMS key for ${local.name} cluster activity stream."
  enable_key_rotation     = false
  is_enabled              = true
  key_usage               = "ENCRYPT_DECRYPT"

  aliases = [local.name]

  tags = local.tags
}

resource "aws_iam_role" "rds_proxy_role" {
  name = "${local.name}-rds-proxy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "rds_proxy_policy" {
  name = "${local.name}-rds-proxy-policy"
  role = aws_iam_role.rds_proxy_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action   = "secretsmanager:GetSecretValue",
        Effect   = "Allow",
        Resource = module.aurora.cluster_master_user_secret[0].secret_arn
      },
      # Optionally, add permissions for RDS/Athena logging and auditing here
    ]
  })
}
# Adding RDS Proxy Reader
resource "aws_db_proxy" "aurora_reader_proxy" {
  name                   = "${local.name}-reader-proxy"
  debug_logging          = false
  engine_family          = "POSTGRESQL"
  idle_client_timeout    = 1800
  require_tls            = true
  role_arn               = aws_iam_role.rds_proxy_role.arn
  vpc_security_group_ids = [module.aurora.security_group_id]
  vpc_subnet_ids         = module.vpc.database_subnets


  auth {
    auth_scheme = "SECRETS"
    description = "example"
    iam_auth    = "DISABLED"
    secret_arn  = module.aurora.cluster_master_user_secret[0].secret_arn
  }
}

resource "aws_db_proxy_default_target_group" "default_reader" {
  db_proxy_name = aws_db_proxy.aurora_reader_proxy.name

  connection_pool_config {
    connection_borrow_timeout    = 120
    max_connections_percent      = 100
    max_idle_connections_percent = 50
    session_pinning_filters     = ["EXCLUDE_VARIABLE_SETS"]
  }
}

resource "aws_db_proxy_target" "aurora_reader_target" {
  db_proxy_name         = aws_db_proxy.aurora_reader_proxy.name
  target_group_name     = aws_db_proxy_default_target_group.default_reader.name
  db_cluster_identifier = module.aurora.cluster_id
}

# Adding RDS Proxy Writer
resource "aws_db_proxy" "aurora_writer_proxy" {
  name                   = "${local.name}-writer-proxy"
  debug_logging          = false
  engine_family          = "POSTGRESQL"
  idle_client_timeout    = 1800
  require_tls            = true
  role_arn               = aws_iam_role.rds_proxy_role.arn
  vpc_security_group_ids = [module.aurora.security_group_id]
  vpc_subnet_ids         = module.vpc.database_subnets


  auth {
    auth_scheme = "SECRETS"
    description = "example"
    iam_auth    = "DISABLED"
    secret_arn  = module.aurora.cluster_master_user_secret[0].secret_arn
  }
}

resource "aws_db_proxy_default_target_group" "default" {
  db_proxy_name = aws_db_proxy.aurora_writer_proxy.name

  connection_pool_config {
    connection_borrow_timeout    = 120
    max_connections_percent      = 100
    max_idle_connections_percent = 50
    session_pinning_filters     = ["EXCLUDE_VARIABLE_SETS"]
  }
}

resource "aws_db_proxy_target" "aurora_target" {
  db_proxy_name           = aws_db_proxy.aurora_writer_proxy.name
  target_group_name       = aws_db_proxy_default_target_group.default.name
  db_cluster_identifier   = module.aurora.cluster_id
}

resource "aws_security_group_rule" "allow_postgres" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = [module.vpc.vpc_cidr_block] 
  security_group_id = module.aurora.security_group_id
  description      = "Allow Postgres traffic from VPC"
}

resource "aws_security_group_rule" "allow_postgres_outbound" {
  type              = "egress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = [module.vpc.vpc_cidr_block]
  security_group_id = module.aurora.security_group_id
  description       = "Allow Postgres traffic from VPC"
}

resource "aws_iam_role" "apprunner_service_role" {
  name = "${local.name}-apprunner-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "apprunner_managed_policy_attachment" {
  role       = aws_iam_role.apprunner_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

resource "aws_iam_role" "apprunner_instance_role" {
  name = "${local.name}-apprunner-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "apprunner_instance_secrets_access" {
  name        = "${local.name}-apprunner-instance-secrets-access"
  description = "Allow AppRunner to access RDS secrets and SSM parameters"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action   = "secretsmanager:GetSecretValue",
        Effect   = "Allow",
        Resource = module.aurora.cluster_master_user_secret[0].secret_arn
      },
      {
        Action   = "secretsmanager:GetSecretValue",
        Effect   = "Allow",
        Resource = var.supabase_creds_secret_arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "apprunner_instance_secrets_access_attachment" {
  role       = aws_iam_role.apprunner_instance_role.name
  policy_arn = aws_iam_policy.apprunner_instance_secrets_access.arn
}

resource "aws_apprunner_vpc_connector" "connector" {
  vpc_connector_name = "connector-${local.name}"
  subnets            = [module.vpc.private_subnets[1]]
  security_groups    = [aws_security_group.bastion_sg.id]
}

resource "aws_apprunner_service" "app_service" {
  service_name = "${local.name}-apprunner-service"
  source_configuration {
    auto_deployments_enabled = true
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_service_role.arn
    }
    image_repository {
      image_identifier      = "${var.image_url}:latest"
      image_repository_type = "ECR"
      image_configuration {
        port                = "8585"
        runtime_environment_secrets = {
          AURORA_CREDS = module.aurora.cluster_master_user_secret[0].secret_arn
          SUPABASE_CREDS = var.supabase_creds_secret_arn
        }
        runtime_environment_variables = {
          # proxy endpoint
          AURORA_HOST     = aws_db_proxy.aurora_writer_proxy.endpoint
          AURORA_PORT     = "5432"
          AURORA_DATABASE = local.database_name
          ENV             = "production"
        }  
      }
    }
  }
  network_configuration{
     egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.connector.arn
    }
  }
  
  health_check_configuration {
    protocol = "HTTP"
    path     = "/healthcheck"
    interval = 10
    timeout  = 5
  }


  instance_configuration {
    cpu    = "2 vCPU"
    memory = "4 GB"
    instance_role_arn = aws_iam_role.apprunner_instance_role.arn 
  }
  # More configurations like auto scaling, tags, etc. can be added if needed.
}




resource "aws_apprunner_service" "valhalla_jawn_staging" {

  service_name = "${local.name}-valhalla-jawn-staging"

  source_configuration {
    auto_deployments_enabled = true
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_service_role.arn
    }
    image_repository {
      image_identifier      = "${var.image_url}-staging:latest"
      image_repository_type = "ECR"
      image_configuration {
        port                = "8585"
        runtime_environment_secrets = {
          AURORA_CREDS = module.aurora.cluster_master_user_secret[0].secret_arn
          SUPABASE_CREDS = var.supabase_creds_secret_arn
        }
        runtime_environment_variables = {
          # proxy endpoint
          AURORA_HOST     = aws_db_proxy.aurora_writer_proxy.endpoint
          AURORA_PORT     = "5432"
          AURORA_DATABASE = local.database_name
          ENV             = "production"
        }  
      }
    }
  }
  network_configuration{
     egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.connector.arn
    }
  }
  
  health_check_configuration {
    protocol = "HTTP"
    path     = "/healthcheck"
    interval = 10
    timeout  = 5
  }


  instance_configuration {
    cpu    = "2 vCPU"
    memory = "4 GB"
    instance_role_arn = aws_iam_role.apprunner_instance_role.arn 
  }


  # More configurations like auto scaling, tags, etc. can be added if needed.
}

