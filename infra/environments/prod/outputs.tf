output "lambda_function_name" {
  value = module.lambda.function_name
}

output "authorizer_function_name" {
  value = module.lambda_authorizer.function_name
}

output "s3_frontend_bucket" {
  value = module.s3_frontend.bucket_id
}

output "cloudfront_distribution_id" {
  value = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  value = module.cloudfront.distribution_domain_name
}

output "api_endpoint" {
  value = module.api_gateway.api_endpoint
}

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_client_id" {
  value = module.cognito.user_pool_client_id
}
