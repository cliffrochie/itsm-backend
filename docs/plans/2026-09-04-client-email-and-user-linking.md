# Client Email & Bi-Directional User Auto-Linking Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Add an optional unique `email` column to the `clients` table, validate it, and implement bi-directional auto-linking between clients and user accounts based on matching email addresses.

**Architecture:** Layered architecture updates (`src/db/schema/clients.ts` -> `src/validators/client.validator.ts` -> `src/services/client.service.ts` and `src/services/user.service.ts`). When a client is created with an email, it auto-associates with an existing user with that email; when a user is created, any unlinked client profile sharing that email is automatically updated with the new user's ID.

**Tech Stack:** TypeScript, Express 5, Drizzle ORM (MySQL), Zod, Vitest, Supertest.

---

### Task 1: Schema Update & Migration

**Files:**
- Modify: `src/db/schema/clients.ts:6-18`
- Test: `tests/unit/schema.test.ts`

**Step 1: Write the failing test**
In `tests/unit/schema.test.ts`, add an assertion checking that `clients.email` is defined:
```ts
it("clients table includes email column", () => {
  expect(schema.clients.email).toBeDefined();
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/schema.test.ts`
Expected: FAIL (`expected undefined to be defined`).

**Step 3: Write minimal implementation**
In `src/db/schema/clients.ts`, add the `email` column:
```ts
export const clients = mysqlTable("clients", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  extensionName: varchar("extension_name", { length: 50 }),
  email: varchar("email", { length: 191 }).unique(),
  contactNo: varchar("contact_no", { length: 50 }),
  officeId: bigint("office_id", { mode: "number", unsigned: true }).references(() => offices.id, { onDelete: "set null" }),
  designationId: bigint("designation_id", { mode: "number", unsigned: true }).references(() => designations.id, { onDelete: "set null" }),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
```
Then generate the Drizzle migration:
`npx drizzle-kit generate`

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/unit/schema.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/db/schema/clients.ts src/db/migrations/* tests/unit/schema.test.ts
git commit -m "feat(schema): add optional unique email column to clients table"
```

---

### Task 2: Client Validator Update

**Files:**
- Modify: `src/validators/client.validator.ts:3-23`
- Test: `tests/unit/validate.test.ts`

**Step 1: Write the failing test**
In `tests/unit/validate.test.ts`, add tests for `createClientSchema` validating valid emails, invalid email formats, and nullable emails.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/validate.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**
Update `src/validators/client.validator.ts`:
- In `createClientSchema`: add `email: z.string().email("Invalid email address format").max(191).optional().nullable(),`
- In `clientQuerySchema`: add `email: z.string().optional(),`

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/unit/validate.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/validators/client.validator.ts tests/unit/validate.test.ts
git commit -m "feat(validation): add email validation to client schemas"
```

---

### Task 3: Client Service Auto-linking and Email Handling

**Files:**
- Modify: `src/services/client.service.ts`
- Test: `tests/feature/clients.test.ts`

**Step 1: Write the failing tests**
In `tests/feature/clients.test.ts`, add feature tests:
1. Creating a client with `email` stores and returns `email`.
2. When creating a client with `email` and no `userId`, if a user exists with that `email`, it automatically links `userId`.
3. Creating a client with invalid email returns 422.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/feature/clients.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**
In `src/services/client.service.ts`:
- In `createClient(input)`:
  - Sanitize email: `const email = input.email ? input.email.trim().toLowerCase() : null;`
  - Determine `userId`:
    ```ts
    let userId = input.userId || null;
    if (!userId && email) {
      const [matchedUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (matchedUser) {
        userId = matchedUser.id;
      }
    }
    ```
  - Insert client with `email` and `userId`.
- In `listClients(query)`:
  - Include `email` in `search` like condition: `like(clients.email, searchPattern)`
  - If `query.email`: filter `eq(clients.email, query.email.trim().toLowerCase())`
- In `updateClient(id, input)`:
  - If `input.email !== undefined`, update `email: input.email ? input.email.trim().toLowerCase() : null`

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/feature/clients.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/services/client.service.ts tests/feature/clients.test.ts
git commit -m "feat(clients): support email and auto-linking to existing user on client creation"
```

---

### Task 4: User Service Auto-linking to Existing Client

**Files:**
- Modify: `src/services/user.service.ts:84-120`
- Test: `tests/feature/users.test.ts`

**Step 1: Write the failing test**
In `tests/feature/users.test.ts`, add a test verifying that when a user is created with an email matching an unlinked client profile (`userId IS NULL`), the client record's `userId` is automatically updated to the new user's ID.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/feature/users.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**
In `src/services/user.service.ts`:
In `createUser(input)`:
After inserting the user record:
```ts
const userEmail = input.email.trim().toLowerCase();
const [matchingClient] = await db
  .select()
  .from(clients)
  .where(and(eq(clients.email, userEmail), isNull(clients.userId)))
  .limit(1);

if (matchingClient) {
  await db
    .update(clients)
    .set({ userId: inserted.id })
    .where(eq(clients.id, matchingClient.id));
}
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/feature/users.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/services/user.service.ts tests/feature/users.test.ts
git commit -m "feat(users): auto-link unlinked client profile when matching user account is created"
```

---

### Task 5: Seeders & Full Regression Suite

**Files:**
- Modify: `src/db/seeds/clients.seed.ts`
- Run: Full test suite

**Step 1: Update seeds**
In `src/db/seeds/clients.seed.ts`, add sample `email` values:
- `walkin`: `email: "maria.delacruz@example.com"`
- `staffClient`: `email: "sarah.connor@itsm.local"`

**Step 2: Run full regression test suite**
Run: `npm test`
Expected: All 12 test files pass.

**Step 3: Commit**
```bash
git add src/db/seeds/clients.seed.ts
git commit -m "chore(seeds): add email addresses to client seeders"
```
