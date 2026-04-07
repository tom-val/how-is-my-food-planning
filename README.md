# Food Planning App

Family meal planning application. Create recipes, plan weekly meals (breakfast, lunch, dinner, snacks), and generate shopping lists with checkboxes. Data is shared within families — members join via invite code.

## Quick Start

### Prerequisites

- [Node.js 22](https://nodejs.org/) (see `.nvmrc`)
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Terraform >= 1.5](https://www.terraform.io/downloads)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [AWS CLI v2](https://aws.amazon.com/cli/)

### Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (requires Supabase connection string in appsettings.Development.json)
cd backend
dotnet run --project src/FoodPlanning.Api
```

## Documentation

### Specs

- [Phase 1: Scaffolding & Infrastructure](docs/phases/01-scaffolding-and-infrastructure.md)
- [Phase 2: Authentication](docs/phases/02-authentication.md)
- [Phase 3: Family Management](docs/phases/03-family-management.md)
- [Phase 4: Recipes](docs/phases/04-recipes.md)
- [Phase 5: Weekly Planner](docs/phases/05-weekly-planner.md)
- [Phase 6: Shopping List](docs/phases/06-shopping-list.md)
- [Phase 7: PWA, i18n & Polish](docs/phases/07-pwa-i18n-polish.md)

## Manual Setup (One-Time)

These steps must be completed manually before the first deployment.

### 1. AWS Account

If you don't already have an AWS account, create one at [aws.amazon.com](https://aws.amazon.com). Ensure you have an IAM user with administrator access for initial setup.

### 2. Terraform State Backend

Create an S3 bucket and DynamoDB table for Terraform state locking. Run these commands with AWS CLI:

```bash
# S3 bucket for state
aws s3api create-bucket \
  --bucket food-planning-terraform-state \
  --region eu-central-1 \
  --create-bucket-configuration LocationConstraint=eu-central-1

aws s3api put-bucket-versioning \
  --bucket food-planning-terraform-state \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket food-planning-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
  }'

aws s3api put-public-access-block \
  --bucket food-planning-terraform-state \
  --public-access-block-configuration '{
    "BlockPublicAcls": true,
    "IgnorePublicAcls": true,
    "BlockPublicPolicy": true,
    "RestrictPublicBuckets": true
  }'

# DynamoDB table for state locking
aws dynamodb create-table \
  --table-name food-planning-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-central-1
```

### 3. GitHub OIDC Role for Terraform

Create an IAM OIDC identity provider and role so GitHub Actions can authenticate without long-lived credentials.

#### 3a. Create OIDC Provider (skip if already exists)

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

#### 3b. Create IAM Role

Create a file `trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:tom-val/how-is-my-food-planning:*"
        }
      }
    }
  ]
}
```

```bash
# Replace <ACCOUNT_ID> in trust-policy.json first

aws iam create-role \
  --role-name food-planning-github-actions \
  --assume-role-policy-document file://trust-policy.json

# Attach AdministratorAccess (scope down later for production)
aws iam attach-role-policy \
  --role-name food-planning-github-actions \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

Note the role ARN — you'll need it for GitHub secrets.

### 4. ACM Certificate

Request an SSL certificate for your domain in **us-east-1** (required for CloudFront):

```bash
aws acm request-certificate \
  --domain-name food.valiunas.dev \
  --validation-method DNS \
  --region us-east-1
```

Follow the output to add the DNS validation CNAME record to your domain. Wait for the certificate to be issued (status: `ISSUED`). Note the certificate ARN.

### 5. Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an organisation
2. Create a new project in the `eu-central-1` region
3. Note the following:
   - **Organisation ID** (from the organisation settings URL)
   - **Database password** (set during project creation)
   - **Project reference** (from project settings)
   - **Supabase access token** (from account settings → Access Tokens)
4. Get the database connection string from project settings → Database → Connection string (Transaction pooler)

### 6. GitHub Repository Secrets

Go to your repository Settings → Secrets and variables → Actions → New repository secret.

Create a `Prod` environment and add these secrets:

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | ARN of the GitHub Actions IAM role (step 3) |
| `SUPABASE_ACCESS_TOKEN` | Supabase management API token |
| `SUPABASE_ORGANIZATION_ID` | Supabase organisation UUID |
| `SUPABASE_DATABASE_PASSWORD` | Supabase project database password |
| `SUPABASE_DB_CONNECTION_STRING` | PostgreSQL connection string (transaction pooler) |
| `ACM_CERTIFICATE_ARN` | ACM certificate ARN for food.valiunas.dev (step 4) |

### 7. DNS Configuration

After the first deployment, point your domain to CloudFront:

1. Get the CloudFront distribution domain name from Terraform outputs or AWS Console
2. Create a CNAME record: `food.valiunas.dev` → `<distribution>.cloudfront.net`

## Development

### Project Structure

```
frontend/          React SPA (Material UI, PWA)
backend/           .NET 10 Lambda API + Node.js authorizer
infra/             Terraform infrastructure
supabase/          Database migrations
docs/              Phase documentation
```

### Deployment

Deployment is automated via GitHub Actions on push to `main`. The pipeline:

1. **Infrastructure** — Terraform apply (creates/updates AWS resources)
2. **Migrations** — Supabase CLI pushes database migrations
3. **Backend + Authorizer + Frontend** — Built and deployed in parallel
