# Client Email & Bi-Directional User Auto-Linking Design Document

**Date:** 2026-09-04  
**Feature Branch:** `feat/client-email-auto-linking`  
**Target Branch:** `development`  
**Status:** Approved  
**Blueprint Reference:** `spec-vault/blueprint/dev-guidelines/backend-node.md` & `api-contract.md`

---

## 1. Problem Statement & Context

In the ITSM system, a client profile can be created prior to a user account being created (for instance, when a walk-in or phone-in customer reports an issue, an administrative staff records a client profile and issues a ticket).

Previously:
- The `clients` table only captured `first_name`, `middle_name`, `last_name`, `extension_name`, `contact_no`, `office_id`, `designation_id`, and `user_id` (nullable).
- When that same individual later registered or had an internal user account created in `users` (`POST /api/v1/users`), `user.service.ts` did not check the `clients` table.
- As a result, the existing client profile remained unlinked (`user_id = null`), leaving all prior service tickets disconnected from the user's account.

Furthermore, if an internal user already existed and a staff member created a client profile for them (`POST /api/v1/clients`), the profile would remain unlinked unless the staff member manually knew and supplied the internal numeric `userId`.

---

## 2. Architecture & Design Decisions

### 2.1 Approach: Bi-Directional Auto-Linking via Nullable Unique Email
1. **Add `email` to `clients` table**:
   - Type: `varchar(191)`
   - Nullable: Yes (walk-in clients without email addresses can still be recorded).
   - Unique: Yes (unique index). Under MySQL semantics, multiple `NULL` values are permitted in a `UNIQUE` column, but duplicate non-null email addresses are rejected.
2. **Auto-linking during User Creation (`POST /api/v1/users`)**:
   - When a new user is inserted into `users`, check `clients` for an existing unlinked profile matching `email = user.email` (case-insensitive) and `user_id IS NULL`.
   - If found, automatically update `clients.user_id = user.id`.
3. **Auto-linking during Client Creation (`POST /api/v1/clients`)**:
   - When a client is created with an `email`, if `userId` is omitted, check `users` for an existing user where `email = client.email` (case-insensitive).
   - If found, automatically link `clients.user_id = existing_user.id`.

---

## 3. Detailed Component Specifications

### 3.1 Database Schema & Migration
- **Schema (`src/db/schema/clients.ts`)**:
  ```ts
  email: varchar("email", { length: 191 }).unique(),
  ```
- **Migration**:
  - Run `drizzle-kit generate` to create migration `0001_add_client_email.sql` adding `email varchar(191)` and `CONSTRAINT clients_email_unique UNIQUE(email)`.

### 3.2 Request Validation (`src/validators/client.validator.ts`)
- **`createClientSchema`**:
  ```ts
  email: z.string().email("Invalid email address format").max(191).optional().nullable(),
  ```
- **`clientQuerySchema`**:
  ```ts
  email: z.string().optional(),
  ```

### 3.3 Service Logic (`src/services/`)
- **`client.service.ts`**:
  - In `createClient(input)`:
    - Sanitize `email`: `input.email ? input.email.trim().toLowerCase() : null`.
    - If `!input.userId && sanitizedEmail`:
      - Query `users` for `eq(users.email, sanitizedEmail)`.
      - If user exists, assign `userId = user.id`.
    - Insert client record.
  - In `listClients(query)`:
    - Add filtering on `like(clients.email, `%${query.search}%`)` and exact filtering on `query.email` if specified.
  - In `updateClient(id, input)`:
    - If `input.email !== undefined`, update `email = input.email ? input.email.trim().toLowerCase() : null`.
- **`user.service.ts`**:
  - In `createUser(input)`:
    - After creating user with `inserted.id`, query `clients` where `and(eq(clients.email, input.email.toLowerCase()), isNull(clients.userId))`.
    - If a matching unlinked client exists, execute `db.update(clients).set({ userId: inserted.id }).where(eq(clients.id, matchingClient.id))`.

### 3.4 Seeders & Fixtures
- Update `src/db/seeds/clients.seed.ts`:
  - `walkin`: `email: "maria.delacruz@example.com"`
  - `staffClient`: `email: "sarah.connor@itsm.local"` (matching staff user email)

---

## 4. Verification & Testing Strategy

1. **Unit / Feature Tests**:
   - `tests/feature/clients.test.ts`:
     - Test client creation with `email`.
     - Test invalid email format rejection (422).
     - Test auto-linking to existing user when `userId` is omitted but `email` matches.
     - Test client creation with `email = null` succeeds.
   - `tests/feature/users.test.ts`:
     - Test user creation auto-links an existing unlinked client with matching email.
2. **Regression Testing**:
   - Run complete Vitest suite to ensure all existing endpoints (auth, tickets, offices, designations, users) pass without regression.
