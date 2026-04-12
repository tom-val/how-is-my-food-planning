output "invoke_arn" {
  value = aws_lambda_function.api.invoke_arn
}

output "function_name" {
  value = aws_lambda_function.api.function_name
}

output "role_name" {
  value = aws_iam_role.lambda_execution.name
}
