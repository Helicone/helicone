# PostgreSQL Example

Configuration in this directory creates a PostgreSQL Aurora cluster.

## Usage

To run this example you need to execute:

```bash
$ export TF_VAR_image_url="your_actual_ecr_image_url"
$ terraform init
$ terraform plan
$ terraform apply
```

Note that this example may create resources which cost money. Run `terraform destroy` when you don't need these resources.

<!-- BEGINNING OF PRE-COMMIT-TERRAFORM DOCS HOOK -->

## Requirements

| Name                                                                     | Version |
| ------------------------------------------------------------------------ | ------- |
| <a name="requirement_terraform"></a> [terraform](#requirement_terraform) | >= 1.0  |
| <a name="requirement_aws"></a> [aws](#requirement_aws)                   | >= 4.67 |

## Providers

| Name                                             | Version |
| ------------------------------------------------ | ------- |
| <a name="provider_aws"></a> [aws](#provider_aws) | >= 4.67 |

## Modules

| Name                                                  | Source                        | Version |
| ----------------------------------------------------- | ----------------------------- | ------- |
| <a name="module_aurora"></a> [aurora](#module_aurora) | ../../                        | n/a     |
| <a name="module_kms"></a> [kms](#module_kms)          | terraform-aws-modules/kms/aws | ~> 2.0  |
| <a name="module_vpc"></a> [vpc](#module_vpc)          | terraform-aws-modules/vpc/aws | ~> 5.0  |

## Resources

| Name                                                                                                                                  | Type        |
| ------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [aws_availability_zones.available](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/availability_zones) | data source |

## Inputs

No inputs.

## Outputs

| Name                                                                                                                                                                          | Description                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| <a name="output_additional_cluster_endpoints"></a> [additional_cluster_endpoints](#output_additional_cluster_endpoints)                                                       | A map of additional cluster endpoints and their attributes                                    |
| <a name="output_cluster_arn"></a> [cluster_arn](#output_cluster_arn)                                                                                                          | Amazon Resource Name (ARN) of cluster                                                         |
| <a name="output_cluster_database_name"></a> [cluster_database_name](#output_cluster_database_name)                                                                            | Name for an automatically created database on cluster creation                                |
| <a name="output_cluster_endpoint"></a> [cluster_endpoint](#output_cluster_endpoint)                                                                                           | Writer endpoint for the cluster                                                               |
| <a name="output_cluster_engine_version_actual"></a> [cluster_engine_version_actual](#output_cluster_engine_version_actual)                                                    | The running version of the cluster database                                                   |
| <a name="output_cluster_hosted_zone_id"></a> [cluster_hosted_zone_id](#output_cluster_hosted_zone_id)                                                                         | The Route53 Hosted Zone ID of the endpoint                                                    |
| <a name="output_cluster_id"></a> [cluster_id](#output_cluster_id)                                                                                                             | The RDS Cluster Identifier                                                                    |
| <a name="output_cluster_instances"></a> [cluster_instances](#output_cluster_instances)                                                                                        | A map of cluster instances and their attributes                                               |
| <a name="output_cluster_master_user_secret"></a> [cluster_master_user_secret](#output_cluster_master_user_secret)                                                             | The generated database master user secret when `manage_master_user_password` is set to `true` |
| <a name="output_cluster_members"></a> [cluster_members](#output_cluster_members)                                                                                              | List of RDS Instances that are a part of this cluster                                         |
| <a name="output_cluster_port"></a> [cluster_port](#output_cluster_port)                                                                                                       | The database port                                                                             |
| <a name="output_cluster_reader_endpoint"></a> [cluster_reader_endpoint](#output_cluster_reader_endpoint)                                                                      | A read-only endpoint for the cluster, automatically load-balanced across replicas             |
| <a name="output_cluster_resource_id"></a> [cluster_resource_id](#output_cluster_resource_id)                                                                                  | The RDS Cluster Resource ID                                                                   |
| <a name="output_cluster_role_associations"></a> [cluster_role_associations](#output_cluster_role_associations)                                                                | A map of IAM roles associated with the cluster and their attributes                           |
| <a name="output_db_cluster_activity_stream_kinesis_stream_name"></a> [db_cluster_activity_stream_kinesis_stream_name](#output_db_cluster_activity_stream_kinesis_stream_name) | The name of the Amazon Kinesis data stream to be used for the database activity stream        |
| <a name="output_db_cluster_cloudwatch_log_groups"></a> [db_cluster_cloudwatch_log_groups](#output_db_cluster_cloudwatch_log_groups)                                           | Map of CloudWatch log groups created and their attributes                                     |
| <a name="output_db_cluster_parameter_group_arn"></a> [db_cluster_parameter_group_arn](#output_db_cluster_parameter_group_arn)                                                 | The ARN of the DB cluster parameter group created                                             |
| <a name="output_db_cluster_parameter_group_id"></a> [db_cluster_parameter_group_id](#output_db_cluster_parameter_group_id)                                                    | The ID of the DB cluster parameter group created                                              |
| <a name="output_db_parameter_group_arn"></a> [db_parameter_group_arn](#output_db_parameter_group_arn)                                                                         | The ARN of the DB parameter group created                                                     |
| <a name="output_db_parameter_group_id"></a> [db_parameter_group_id](#output_db_parameter_group_id)                                                                            | The ID of the DB parameter group created                                                      |
| <a name="output_db_subnet_group_name"></a> [db_subnet_group_name](#output_db_subnet_group_name)                                                                               | The db subnet group name                                                                      |
| <a name="output_enhanced_monitoring_iam_role_arn"></a> [enhanced_monitoring_iam_role_arn](#output_enhanced_monitoring_iam_role_arn)                                           | The Amazon Resource Name (ARN) specifying the enhanced monitoring role                        |
| <a name="output_enhanced_monitoring_iam_role_name"></a> [enhanced_monitoring_iam_role_name](#output_enhanced_monitoring_iam_role_name)                                        | The name of the enhanced monitoring role                                                      |
| <a name="output_enhanced_monitoring_iam_role_unique_id"></a> [enhanced_monitoring_iam_role_unique_id](#output_enhanced_monitoring_iam_role_unique_id)                         | Stable and unique string identifying the enhanced monitoring role                             |
| <a name="output_security_group_id"></a> [security_group_id](#output_security_group_id)                                                                                        | The security group ID of the cluster                                                          |

<!-- END OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
