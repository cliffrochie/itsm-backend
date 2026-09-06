# Auto-Create Client Details on User Creation Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Automatically create equivalent client details when an admin creates a user account, with support for optional `officeId` and `designationId`.

**Architecture:** Extend `createUserSchema` with optional `officeId` and `designationId`. In `UserService.createUser`, wrap the creation inside a database transaction (`db.transaction`) to atomically insert the user and either link an existing unlinked client profile or create a brand new client profile with matching contact and organizational attributes.

**Tech Stack:** Node.js, Express, TypeScript, Drizzle ORM, MySQL, Zod, Vitest, Supertest.

---

### Task 1: Extend User Validator with `officeId` and `designationId`

**Files:**
- Modify: `src/validators/user.validator.ts`
- Test: `tests/unit/userValidator.test.ts`

**Step 1: Write the failing test**
Add tests to `tests/unit/userValidator.test.ts` validating that `createUserSchema` accepts valid optional `officeId` and `designationId`, coerces string numbers, and rejects invalid non-positive integers.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/userValidator.test.ts`
Expected: FAIL (unrecognized or unhandled properties if tested strictly).

**Step 3: Write minimal implementation**
In `src/validators/user.validator.ts`:
Add `officeId: z.coerce.number().int().positive().optional().nullable()` and `designationId: z.coerce.number().int().positive().optional().nullable()` to `createUserSchema`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/unit/userValidator.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/validators/user.validator.ts tests/unit/userValidator.test.ts
git commit -m "feat(users): add optional officeId and designationId to createUserSchema"
```

---

### Task 2: Implement Auto-Creation and Linking in `UserService.createUser`

**Files:**
- Modify: `src/services/user.service.ts`
- Test: `tests/unit/userService.test.ts`

**Step 1: Write the failing tests**
Update `tests/unit/userService.test.ts` with tests for:
1. Auto-creating a new client record when no matching unlinked client exists.
2. Linking an existing unlinked client and updating `officeId` and `designationId` when provided.
3. Rejecting with `ValidationError` if a client with that email already exists and is linked to another user.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/userService.test.ts`
Expected: FAIL because `createUser` does not yet insert a new client record when none exists.

**Step 3: Write minimal implementation**
In `src/services/user.service.ts`:
1. Within `createUser`:
   - Check `users` uniqueness.
   - Run `db.transaction(async (tx) => { ... })`.
   - In `tx`:
     - Insert user row.
     - Normalize email.
     - Query `clients` for matching email.
     - If client exists and `userId` is not null (different user), throw `ValidationError`.
     - If unlinked client exists (`userId` is null), update it with `userId: inserted.id` and provided `officeId`/`designationId`.
     - If no client exists, insert new client into `clients` with uppercase names, email, contactNo, officeId, designationId, and userId.
   - Return sanitized user via `getUserById`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/unit/userService.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/services/user.service.ts tests/unit/userService.test.ts
git commit -m "feat(users): auto-create client details upon user creation in transaction"
```

---

### Task 3: OpenAPI Documentation Update

**Files:**
- Modify: `src/docs/schemas.ts`
- Modify: `src/docs/paths/users.paths.ts` (if applicable)
- Test: `tests/unit/openapi.test.ts`

**Step 1: Write or check OpenAPI test**
Ensure OpenAPI spec generation test covers the updated user creation parameters.

**Step 2: Run test to verify state**
Run: `npx vitest run tests/unit/openapi.test.ts`

**Step 3: Write documentation update**
Update OpenAPI schema for user create request body to include optional `officeId` and `designationId`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/unit/openapi.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/docs/schemas.ts src/docs/paths/users.paths.ts tests/unit/openapi.test.ts
git commit -m "docs(api): document officeId and designationId in user creation schema"
```

---

### Task 4: Feature Test & Full Regression Suite

**Files:**
- Modify: `tests/feature/users.test.ts`

**Step 1: Write feature test**
Add test case to `tests/feature/users.test.ts` testing `POST /api/v1/users` with `officeId` and `designationId`.

**Step 2: Run test to verify it passes**
Run: `npx vitest run tests/feature/users.test.ts`
Expected: PASS.

**Step 3: Run full regression test suite**
Run: `npm test`
Expected: All 28+ test files and 198+ tests PASS.

**Step 4: Commit**
```bash
git add tests/feature/users.test.ts
git commit -m "test(users): add feature tests for user creation with client details"
```
