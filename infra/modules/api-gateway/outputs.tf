output "api_id" {
  value = aws_apigatewayv2_api.api.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

output "execution_arn" {
  value = aws_apigatewayv2_api.api.execution_arn
}

output "lambda_integration_id" {
  value = aws_apigatewayv2_integration.lambda.id
}
