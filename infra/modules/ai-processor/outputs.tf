output "queue_url" {
  value = aws_sqs_queue.ai_recipe.url
}

output "function_name" {
  value = aws_lambda_function.processor.function_name
}
