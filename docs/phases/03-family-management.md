# Phase 3: Family Management

## Goal

Users can create a family, get an invite code, and share it with family members. Members join via the code and become part of the family. All subsequent features are scoped to the family.

## Tasks

### Backend
- [ ] Create `Features/Families/` folder
- [ ] `FamilyRepository` — CRUD operations on `families` and `family_members` tables
- [ ] `FamilyEndpoints`:
  - `POST /v1/families` — Create family (current user becomes owner)
  - `GET /v1/families/my` — Get current user's family (returns family + members)
  - `POST /v1/families/join` — Join by invite code (body: `{ inviteCode, displayName }`)
  - `GET /v1/families/{id}/members` — List family members
  - `POST /v1/families/{id}/regenerate-code` — Owner regenerates invite code
  - `DELETE /v1/families/{id}/members/{userId}` — Owner removes a member
- [ ] `FamilyValidators` — Validate create/join requests
- [ ] `FamilyMembershipService` — Helper to check if user belongs to a family (used by all features)
- [ ] Unit tests for validators and membership checks

### Frontend
- [ ] Create `features/family/` folder
- [ ] "No Family" state — show create or join options
- [ ] Create Family page (name input → creates family → shows invite code)
- [ ] Join Family page (invite code input → joins → redirects to home)
- [ ] Family Members page (list members, show invite code, copy button)
- [ ] Integrate into app layout (show family name in header)
- [ ] Add translations

## Verification

- Create a family → get invite code
- Share code → second user joins
- Both users see the same family and members
- Owner can remove a member
- Non-owner cannot access owner-only endpoints
