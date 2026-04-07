# Food Planning App

Family meal planning application — plan weekly meals, manage recipes, and generate shopping lists.

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, Material UI, i18next, vite-plugin-pwa
- **Backend:** .NET 10 Lambda (minimal API, feature folders)
- **Database:** Supabase (PostgreSQL only — no Supabase Auth)
- **Auth:** AWS Cognito (user pool + app client)
- **Authorizer:** Node.js Lambda (validates Cognito JWTs via JWKS)
- **Infrastructure:** Terraform (modular), single prod environment
- **CI/CD:** GitHub Actions
- **CDN:** CloudFront + S3

## Architecture

- **API:** HTTP API Gateway v2 → Lambda authorizer → .NET Lambda
- **Auth flow:** Cognito sign-up/sign-in → JWT → API Gateway authorizer validates → userId in context
- **Data isolation:** All queries scoped by `family_id`, enforced at API layer (no RLS — Supabase used as DB only)
- **Family membership:** Join via invite code, checked in repository layer

## Project Structure

```
frontend/          React SPA (Material UI, PWA)
backend/
  src/
    FoodPlanning.Api/    .NET 10 minimal API
    authorizer/          Node.js Cognito JWT validator
  tests/
    FoodPlanning.Api.Tests/
infra/
  modules/         Reusable Terraform modules
  environments/
    prod/          Production environment composition
supabase/
  migrations/      PostgreSQL schema migrations
docs/
  phases/          Implementation phase documentation
```

## Conventions

- **Language:** British English in code, comments, and documentation
- **Backend pattern:** Feature folders (`Features/{Feature}/Endpoints.cs`, `Repository.cs`, `Validators.cs`)
- **Frontend pattern:** Feature folders (`features/{feature}/`)
- **API prefix:** `/v1/`
- **Naming:** camelCase for methods/properties, PascalCase for C# types
- **i18n:** Lithuanian (default) and English. Translation keys in `src/i18n/{lt,en}.json`
- **Database:** Migrations in `supabase/migrations/` with timestamp prefix
- **Terraform:** Modules in `infra/modules/`, composed in `infra/environments/prod/main.tf`

## Commands

```bash
# Frontend
cd frontend && npm install && npm run dev     # Local dev server
cd frontend && npm run build                   # Production build
cd frontend && npm run lint                    # Lint

# Backend
cd backend && dotnet build src/FoodPlanning.Api  # Build
cd backend && dotnet test                        # Run tests
cd backend && dotnet run --project src/FoodPlanning.Api  # Local dev

# Infrastructure
cd infra/environments/prod && terraform init && terraform plan

# Database
supabase db push  # Apply migrations (requires supabase link)
```
