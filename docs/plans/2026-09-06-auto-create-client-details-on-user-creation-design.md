# Auto-Create Client Details on User Creation Design Document

**Date:** 2026-09-06  
**Feature:** Auto-create Equivalent Client Details on User Creation  
**Status:** Approved  

---

## 1. Problem Statement & Context

In the ITSM system, every service ticket is associated with a client profile (`clientId`).
Previously:
- When an administrator creates a new user account via `POST /api/v1/users`, `user.service.ts` only checked whether an existing unlinked client profile with matching email already existed to link to the new `userId`.
- If no client profile existed, no client record was created. Consequently, the new user had no client details record, requiring staff to separately create a client record or leaving the user unable to have tickets filed on their behalf without manual association.

The requirement is: when an admin creates a user account, it should automatically create equivalent client details.

---

## 2. Scope & Design Decisions

1. **User Role Scope**:
   - Applies to **all user roles** (`admin`, `service_engineer`, `staff`, `user`). Every user created in the system gets an associated client profile.

2. **Schema & Validator Extension**:
   - `createUserSchema` in `src/validators/user.validator.ts` is extended with optional, nullable fields:
     - `officeId`: `z.coerce.number().int().positive().optional().nullable()`
     - `designationId`: `z.coerce.number().int().positive().optional().nullable()`
   - These allow administrators to assign office and designation to the client profile during user provisioning.

3. **Atomic Transactional Execution**:
   - User creation and client profile creation/linking will run inside a database transaction (`db.transaction(async (tx) => { ... })`).
   - If client creation fails (e.g. invalid foreign key reference for `officeId`), the transaction rolls back cleanly, avoiding orphan user accounts.

4. **Creation & Auto-Linking Logic**:
   - Check `users` for `username` and `email` uniqueness.
   - Hash password using `bcrypt.hash(input.password, 10)`.
   - Within `db.transaction`:
     1. Insert new user into `users` (uppercase `firstName`, `middleName`, `lastName`, `extensionName`).
     2. Normalize user email (`input.email.trim().toLowerCase()`).
     3. Check `clients` for an unlinked client profile (`email = userEmail` and `userId IS NULL`):
        - **If found**: Update existing client (`userId = insertedUserId`), updating `officeId` and `designationId` if provided in `input`.
        - **If not found**: Check if another client already holds this email linked to another user. If so, throw a 422 `ValidationError` indicating the conflict. Otherwise, insert a new `clients` record with:
          - `firstName`: `input.firstName.toUpperCase()`
          - `middleName`: `input.middleName ? input.middleName.toUpperCase() : null`
          - `lastName`: `input.lastName.toUpperCase()`
          - `extensionName`: `input.extensionName ? input.extensionName.toUpperCase() : null`
          - `email`: `userEmail`
          - `contactNo`: `input.contactNo || null`
          - `officeId`: `input.officeId || null`
          - `designationId`: `input.designationId || null`
          - `userId`: `insertedUserId`
   - Return the created user without password via `getUserById(insertedUserId)`.

5. **Scope Limitation**:
   - Focus is strictly on user creation. Future profile updates (`PUT /api/v1/users/:id`) remain independent.

---

## 3. Detailed Component Specifications

### 3.1 Request Validation (`src/validators/user.validator.ts`)
- Add `officeId` and `designationId` to `createUserSchema`.
- `updateUserSchema` continues to strip or handle them without modifying the user table.

### 3.2 OpenAPI Specification (`src/docs/paths/users.paths.ts` and `src/docs/schemas.ts`)
- Document `officeId` and `designationId` in user creation request body documentation.

### 3.3 Service Layer (`src/services/user.service.ts`)
- Implement the transactional creation and auto-creation / linking in `createUser`.

---

## 4. Verification & Testing Strategy

1. **Unit Tests (`tests/unit/userService.test.ts`)**:
   - Test auto-creating client record when no matching client exists.
   - Test auto-linking existing unlinked client record and updating office/designation when provided.
   - Test rejection with 422 when email is already taken by a client linked to another user.
2. **Feature Tests (`tests/feature/users.test.ts`)**:
   - Test `POST /api/v1/users` successfully creates user and client profile with optional `officeId` and `designationId`.
   - Test validation of `officeId` and `designationId`.
3. **Full Regression Suite**:
   - Execute `npm test` across all test files to ensure 100% pass rate.
