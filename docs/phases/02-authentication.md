# Phase 2: Authentication

## Goal

Implement full authentication flow using AWS Cognito. Users can sign up, sign in, reset passwords, and access protected API endpoints.

## Tasks

### Frontend
- [ ] Install `amazon-cognito-identity-js`
- [ ] Create `AuthProvider` with Cognito session management
- [ ] Create `useAuth` hook (user, isAuthenticated, signIn, signUp, signOut, getAccessToken)
- [ ] Create Login page (email + password, link to register)
- [ ] Create Register page (email + password + display name, email confirmation)
- [ ] Create Forgot Password page (email → confirmation code → new password)
- [ ] Create route guards (redirect to login if unauthenticated)
- [ ] Configure API client (`api/client.ts`) with Cognito token injection via axios interceptor
- [ ] Add translations for auth pages (Lithuanian + English)

### Backend
- [ ] Create `AuthorizerContextMiddleware` — reads `userId` from Lambda authorizer context
- [ ] Create `HttpContextExtensions.GetUserId()` helper
- [ ] Add public route detection (health endpoint)

## Verification

- Sign up with email → receive confirmation → confirm → sign in
- Access protected endpoint with valid token → 200
- Access protected endpoint without token → 401
- Sign out → token cleared → redirected to login
