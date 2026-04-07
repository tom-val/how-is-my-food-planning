# Phase 1: Scaffolding & Infrastructure

## Goal

Set up the complete project structure, infrastructure-as-code, and CI/CD pipeline. Deploy a minimal health endpoint to verify the full stack works end-to-end.

## Tasks

### Project Setup
- [x] Create `CLAUDE.md` with project conventions
- [x] Create `README.md` with manual setup instructions
- [x] Create phase documentation files (`docs/phases/01-07`)

### Frontend Scaffolding
- [ ] Initialise Vite + React + TypeScript project
- [ ] Install Material UI, React Router, React Query, i18next, vite-plugin-pwa
- [ ] Create basic app structure (App.tsx, router.tsx, theme.ts)
- [ ] Create placeholder pages (Home, Login)
- [ ] Configure ESLint
- [ ] Add `.nvmrc` (Node 22)

### Backend Scaffolding
- [ ] Create .NET 10 Lambda project (`FoodPlanning.Api`)
- [ ] Add NuGet packages (Lambda hosting, Npgsql, FluentValidation)
- [ ] Create `Program.cs` with middleware pipeline
- [ ] Create health endpoint
- [ ] Create shared middleware (ExceptionHandling, RequestLogging, AuthorizerContext)
- [ ] Create `appsettings.json` and `appsettings.Development.json`
- [ ] Create unit test project

### Authorizer Lambda
- [ ] Create `backend/src/authorizer/` with `index.mjs` and `package.json`
- [ ] Implement Cognito JWT validation via JWKS discovery
- [ ] Use `jose` library for JWT verification

### Database
- [ ] Create `supabase/config.toml`
- [ ] Create initial migration (`20260407000000_initial_schema.sql`) with all tables

### Terraform Modules
- [ ] `infra/modules/cognito/` — User pool + app client
- [ ] `infra/modules/lambda/` — .NET API Lambda + IAM role + CloudWatch logs
- [ ] `infra/modules/lambda-authorizer/` — Cognito JWT authorizer + public routes
- [ ] `infra/modules/api-gateway/` — HTTP API v2 + Lambda integration + CORS
- [ ] `infra/modules/s3-frontend/` — Private S3 bucket
- [ ] `infra/modules/cloudfront/` — CDN with SPA routing + ACM cert

### Terraform Environment
- [ ] `infra/environments/prod/backend.tf` — State backend (S3 + DynamoDB)
- [ ] `infra/environments/prod/main.tf` — Compose all modules
- [ ] `infra/environments/prod/variables.tf` — Input variables
- [ ] `infra/environments/prod/outputs.tf` — Exported outputs

### CI/CD
- [ ] `.github/workflows/deploy-prod.yml` — Full deployment pipeline

## Verification

- `dotnet build` succeeds for backend
- `npm run build` succeeds for frontend
- `terraform plan` succeeds (with required variables)
- Health endpoint returns `{ "status": "healthy" }` after deployment
