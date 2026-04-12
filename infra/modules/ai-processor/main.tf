# AI Processor module — SQS queue + Node.js Lambda for async OpenAI recipe generation.

# --- SQS Queue ---

resource "aws_sqs_queue" "ai_recipe" {
  name                       = "${var.project_name}-${var.environment}-ai-recipe"
  visibility_timeout_seconds = 120
  message_retention_seconds  = 86400
  receive_wait_time_seconds  = 5
}

resource "aws_sqs_queue" "ai_recipe_dlq" {
  name                      = "${var.project_name}-${var.environment}-ai-recipe-dlq"
  message_retention_seconds = 1209600
}

resource "aws_sqs_queue_redrive_policy" "ai_recipe" {
  queue_url = aws_sqs_queue.ai_recipe.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.ai_recipe_dlq.arn
    maxReceiveCount     = 2
  })
}

# --- IAM ---

resource "aws_iam_role" "processor" {
  name = "${var.project_name}-${var.environment}-ai-processor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "processor_basic_execution" {
  role       = aws_iam_role.processor.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy" "processor_sqs" {
  name = "${var.project_name}-${var.environment}-ai-processor-sqs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
      ]
      Resource = aws_sqs_queue.ai_recipe.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "processor_sqs" {
  role       = aws_iam_role.processor.name
  policy_arn = aws_iam_policy.processor_sqs.arn
}

# --- CloudWatch ---

resource "aws_cloudwatch_log_group" "processor" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-ai-processor"
  retention_in_days = 14
}

# --- Lambda ---

data "archive_file" "dummy" {
  type        = "zip"
  output_path = "${path.module}/dummy.zip"

  source {
    content  = "placeholder"
    filename = "placeholder.txt"
  }
}

resource "aws_lambda_function" "processor" {
  function_name    = "${var.project_name}-${var.environment}-ai-processor"
  role             = aws_iam_role.processor.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  memory_size      = 256
  timeout          = 120
  filename         = data.archive_file.dummy.output_path
  source_code_hash = data.archive_file.dummy.output_base64sha256

  environment {
    variables = {
      OPENAI_API_KEY     = var.openai_api_key
      DB_CONNECTION_STRING = var.db_connection_string
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.processor_basic_execution,
    aws_cloudwatch_log_group.processor,
  ]

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# --- SQS Event Source ---

resource "aws_lambda_event_source_mapping" "ai_recipe" {
  event_source_arn = aws_sqs_queue.ai_recipe.arn
  function_name    = aws_lambda_function.processor.arn
  batch_size       = 1
}

# --- API Lambda SQS publish permission ---

resource "aws_iam_policy" "api_sqs_publish" {
  name = "${var.project_name}-${var.environment}-api-sqs-ai-recipe"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.ai_recipe.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "api_sqs_publish" {
  role       = var.api_lambda_role_name
  policy_arn = aws_iam_policy.api_sqs_publish.arn
}
