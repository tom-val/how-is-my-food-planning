output "authorizer_id" {
  value = aws_apigatewayv2_authorizer.jwt.id
}

output "function_name" {
  value = aws_lambda_function.authorizer.function_name
}
