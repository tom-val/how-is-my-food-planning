# Lambda Authorizer module — Node.js Lambda for Cognito JWT validation,
# API Gateway authorizer, and explicit public routes.

data "archive_file" "dummy" {
  type        = "zip"
  output_path = "${path.module}/dummy.zip"

  source {
    content  = "placeholder"
    filename = "placeholder.txt"
  }
}

# --- IAM ---

resource "aws_iam_role" "authorizer" {
  name = "${var.project_name}-${var.environment}-authorizer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "authorizer_basic_execution" {
  role       = aws_iam_role.authorizer.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- CloudWatch ---

resource "aws_cloudwatch_log_group" "authorizer" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-authorizer"
  retention_in_days = 14
}

# --- Lambda ---

resource "aws_lambda_function" "authorizer" {
  function_name    = "${var.project_name}-${var.environment}-authorizer"
  role             = aws_iam_role.authorizer.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  memory_size      = 128
  timeout          = 10
  filename         = data.archive_file.dummy.output_path
  source_code_hash = data.archive_file.dummy.output_base64sha256

  environment {
    variables = {
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
      AWS_REGION_OVERRIDE  = var.aws_region
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.authorizer_basic_execution,
    aws_cloudwatch_log_group.authorizer,
  ]

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# --- API Gateway Authorizer ---

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id                            = var.api_id
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.authorizer.invoke_arn
  identity_sources                  = ["$request.header.Authorization"]
  name                              = "${var.project_name}-${var.environment}-jwt-authorizer"
  authorizer_payload_format_version = "2.0"
  authorizer_result_ttl_in_seconds  = 300
  enable_simple_responses           = true
}

resource "aws_lambda_permission" "api_gateway_authorizer" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/authorizers/${aws_apigatewayv2_authorizer.jwt.id}"
}

# --- Public routes (no authorizer) ---

resource "aws_apigatewayv2_route" "health" {
  api_id    = var.api_id
  route_key = "GET /health"
  target    = "integrations/${var.lambda_integration_id}"
}
