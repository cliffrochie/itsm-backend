# ITSM Backend Overhaul Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Overhaul `itsm-backend` from Express 4 + Mongoose (MongoDB) to Express 5 (TypeScript) + Drizzle ORM (MySQL) conforming 100% to the blueprint dev-guidelines, layered architecture, `/api/v1/` routes, and standard response envelopes.

**Architecture:** Layered architecture (`routes/v1` -> `middlewares` [validate, authenticate, authorize] -> `controllers` -> `services` [transactions, business logic] -> `db/client.ts` [Drizzle + MySQL2 pool]) returning uniform `{ data, message, errors }` envelopes and running in an isolated Git worktree (`.worktrees/v2-blueprint-overhaul`).

**Tech Stack:** Node.js, Express 5, TypeScript, Drizzle ORM, MySQL 8, Zod, Vitest, Supertest, Socket.IO, Pino, Helmet, CORS, bcrypt, jsonwebtoken.

---

### Task 1: Environment & Tooling Setup

**Files:**
- Create in worktree: `package.json`
- Create in worktree: `tsconfig.json`
- Create in worktree: `drizzle.config.ts`
- Create in worktree: `vitest.config.ts`
- Create in worktree: `.env.example`
- Create in worktree: `src/config/env.ts`
- Test: `tests/unit/env.test.ts`

**Step 1: Write failing test for environment configuration**
```typescript
// tests/unit/env.test.ts
import { describe, it, expect } from "vitest";
import { validateEnv } from "../../src/config/env";

describe("Environment Config", () => {
  it("should fail validation if DATABASE_URL is missing", () => {
    expect(() => validateEnv({})).toThrow();
  });

  it("should validate and return parsed env when valid", () => {
    const env = validateEnv({
      DATABASE_URL: "mysql://root:password@localhost:3306/itsm_test",
      PORT: "5000",
      JWT_SECRET: "super-secret-key-at-least-32-chars-long",
      NODE_ENV: "test",
    });
    expect(env.PORT).toBe(5000);
    expect(env.DATABASE_URL).toBe("mysql://root:password@localhost:3306/itsm_test");
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npm run test` (in `.worktrees/v2-blueprint-overhaul`)
Expected: FAIL with module not found / validation error.

**Step 3: Write minimal implementation**
Install dependencies:
`npm install express@5 drizzle-orm mysql2 zod jsonwebtoken bcrypt helmet cors pino pino-http express-rate-limit socket.io`
`npm install -D typescript tsx drizzle-kit vitest supertest @types/express @types/node @types/jsonwebtoken @types/bcrypt @types/cors @types/supertest`

Configure `src/config/env.ts`:
```typescript
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, any> = process.env): Env {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return result.data;
}

export const env = validateEnv(process.env);
```

**Step 4: Run test to verify it passes**
Run: `npm run test`
Expected: PASS

**Step 5: Commit**
```bash
git add package.json tsconfig.json drizzle.config.ts vitest.config.ts .env.example src/config/env.ts tests/unit/env.test.ts
git commit -m "feat: initialize project configuration and zod env validation"
```

---

### Task 2: Drizzle ORM Schema & Database Client

**Files:**
- Create: `src/db/client.ts`
- Create: `src/db/schema/users.ts`
- Create: `src/db/schema/offices.ts`
- Create: `src/db/schema/designations.ts`
- Create: `src/db/schema/clients.ts`
- Create: `src/db/schema/serviceTickets.ts`
- Create: `src/db/schema/serviceTicketHistories.ts`
- Create: `src/db/schema/ticketCounters.ts`
- Create: `src/db/schema/notifications.ts`
- Create: `src/db/schema/actionLogs.ts`
- Create: `src/db/schema/index.ts`
- Test: `tests/unit/schema.test.ts`

**Step 1: Write failing test verifying schema exports and relations**
```typescript
// tests/unit/schema.test.ts
import { describe, it, expect } from "vitest";
import * as schema from "../../src/db/schema";

describe("Database Schema Definitions", () => {
  it("exports all expected entities", () => {
    expect(schema.users).toBeDefined();
    expect(schema.offices).toBeDefined();
    expect(schema.designations).toBeDefined();
    expect(schema.clients).toBeDefined();
    expect(schema.serviceTickets).toBeDefined();
    expect(schema.serviceTicketHistories).toBeDefined();
    expect(schema.ticketCounters).toBeDefined();
    expect(schema.notifications).toBeDefined();
    expect(schema.actionLogs).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/schema.test.ts`
Expected: FAIL (modules not found)

**Step 3: Implement schemas with Drizzle `mysqlTable`**
- In `src/db/schema/users.ts`: `id`, `username`, `email`, `password`, `first_name`, `middle_name`, `last_name`, `extension_name`, `contact_no`, `avatar`, `role`, `is_active`, `created_at`, `updated_at`.
- In `src/db/schema/clients.ts`: `id`, `first_name`, `middle_name`, `last_name`, `extension_name`, `contact_no`, `office_id` (FK), `designation_id` (FK), `user_id` (FK nullable), `created_at`, `updated_at`.
- In `src/db/schema/serviceTickets.ts`: `id`, `ticket_no` (unique), `task_type`, `title`, `nature_of_work`, `serial_no`, `equipment_type`, `equipment_type_others`, `defects_found`, `service_rendered`, `service_status`, `priority`, `remarks`, `admin_remarks`, `rating`, `rating_comment`, `client_id` (FK), `service_engineer_id` (FK), `created_by_id` (FK), `updated_by_id` (FK), `created_at`, `updated_at`.
- In `src/db/schema/serviceTicketHistories.ts`: `id`, `service_ticket_id` (FK), `performed_by_id` (FK), `action`, `notes`, `created_at`.
- In `src/db/schema/ticketCounters.ts`: `id`, `year`, `month`, `last_count`, `updated_at`.
- In `src/db/schema/offices.ts`: `id`, `name`, `code`, `created_at`, `updated_at`.
- In `src/db/schema/designations.ts`: `id`, `name`, `created_at`, `updated_at`.
- In `src/db/schema/notifications.ts`: `id`, `user_id` (FK), `ticket_id` (FK nullable), `title`, `message`, `is_read`, `created_at`.
- In `src/db/schema/actionLogs.ts`: `id`, `user_id` (FK nullable), `action`, `entity`, `entity_id`, `details`, `ip_address`, `created_at`.
- `src/db/client.ts`: Connection pool with `drizzle-orm/mysql2`.

**Step 4: Run test to verify it passes & generate SQL migrations**
Run: `npx vitest run tests/unit/schema.test.ts`
Run: `npx drizzle-kit generate`
Expected: PASS and SQL files generated in `src/db/migrations/`.

**Step 5: Commit**
```bash
git add src/db/ tests/unit/schema.test.ts
git commit -m "feat: define relational schemas with drizzle-orm"
```

---

### Task 3: API Response Envelopes & Central Middlewares

**Files:**
- Create: `src/responses/envelope.ts`
- Create: `src/middlewares/errorHandler.ts`
- Create: `src/middlewares/validate.ts`
- Create: `src/middlewares/authenticate.ts`
- Create: `src/types/auth.ts`
- Test: `tests/unit/envelope.test.ts`
- Test: `tests/unit/validate.test.ts`

**Step 1: Write failing tests for envelope formatting and validation middleware**
```typescript
// tests/unit/envelope.test.ts
import { describe, it, expect } from "vitest";
import { formatSuccess, formatError, formatPaginated } from "../../src/responses/envelope";

describe("API Contract Envelopes", () => {
  it("formats success envelope correctly", () => {
    const res = formatSuccess({ id: 1 }, "Created");
    expect(res).toEqual({ data: { id: 1 }, message: "Created", errors: null });
  });

  it("formats error envelope correctly", () => {
    const res = formatError("Validation failed", { email: ["Invalid email"] });
    expect(res).toEqual({ data: null, message: "Validation failed", errors: { email: ["Invalid email"] } });
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/envelope.test.ts`
Expected: FAIL

**Step 3: Implement envelope helpers and middlewares**
- `formatSuccess(data, message)`
- `formatError(message, errors)`
- `formatPaginated(data, meta, message)`
- `validate(schema, source = "body")`: returns 422 with formatted errors on Zod validation failure.
- `errorHandler`: catches `ZodError` (422), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), general errors (500).
- `authenticate`: extracts Bearer token, verifies via JWT, loads user context onto `req.user`.

**Step 4: Run tests to verify they pass**
Run: `npx vitest run tests/unit/`
Expected: PASS

**Step 5: Commit**
```bash
git add src/responses/ src/middlewares/ src/types/ tests/unit/envelope.test.ts
git commit -m "feat: implement standard response envelopes and core middlewares"
```

---

### Task 4: Express Application Shell & Health Check

**Files:**
- Create: `src/app.ts`
- Create: `src/index.ts`
- Test: `tests/feature/health.test.ts`

**Step 1: Write failing test for health endpoint**
```typescript
// tests/feature/health.test.ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

describe("GET /api/v1/health", () => {
  it("returns 200 with standard envelope", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.errors).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/feature/health.test.ts`
Expected: FAIL

**Step 3: Implement Express 5 `createApp`**
Set up Helmet, CORS, JSON body parser, Pino logger middleware, error handler, and mount `/api/v1/health`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/feature/health.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/app.ts src/index.ts tests/feature/health.test.ts
git commit -m "feat: setup express 5 app shell and health check route"
```

---

### Task 5: Authentication Domain (`/api/v1/auth`)

**Files:**
- Create: `src/validators/auth.validator.ts`
- Create: `src/services/auth.service.ts`
- Create: `src/controllers/auth.controller.ts`
- Create: `src/routes/v1/auth.routes.ts`
- Test: `tests/feature/auth.test.ts`

**Step 1: Write failing feature test for login & profile**
```typescript
// tests/feature/auth.test.ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

describe("POST /api/v1/auth/login", () => {
  it("returns 422 when payload is invalid", async () => {
    const app = createApp();
    const res = await request(app).post("/api/v1/auth/login").send({});
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/feature/auth.test.ts`
Expected: FAIL

**Step 3: Implement Auth Domain**
- `loginSchema`: requires `usernameOrEmail` and `password`.
- `AuthService.login`: finds user by username or email, verifies password with `bcrypt.compare`, issues JWT token.
- `AuthController.login`: calls service, returns `{ token, user }` in success envelope.
- `AuthController.me`: returns authenticated `req.user` profile.
- Mount routes on `/api/v1/auth`.

**Step 4: Run tests to verify they pass**
Run: `npx vitest run tests/feature/auth.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/validators/auth.validator.ts src/services/auth.service.ts src/controllers/auth.controller.ts src/routes/v1/auth.routes.ts tests/feature/auth.test.ts
git commit -m "feat: implement authentication domain with jwt bearer tokens"
```

---

### Task 6: Users Management Domain (`/api/v1/users`)

**Files:**
- Create: `src/validators/user.validator.ts`
- Create: `src/services/user.service.ts`
- Create: `src/controllers/user.controller.ts`
- Create: `src/routes/v1/users.routes.ts`
- Test: `tests/feature/users.test.ts`

**Step 1: Write failing tests for user creation and listing**
```typescript
// tests/feature/users.test.ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

describe("Users Endpoints", () => {
  it("rejects unauthorized access", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/users");
    expect(res.status).toBe(401);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/feature/users.test.ts`
Expected: FAIL

**Step 3: Implement Users Domain**
- Schemas: `createUserSchema`, `updateUserSchema`, `userQuerySchema`.
- `UserService`: CRUD, pagination, auto-uppercase for `first_name`, `middle_name`, `last_name`, `extension_name`, password hashing on create.
- `UserController`: Thin orchestrator.
- Mount on `/api/v1/users`.

**Step 4: Run tests to verify they pass**
Run: `npx vitest run tests/feature/users.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/validators/user.validator.ts src/services/user.service.ts src/controllers/user.controller.ts src/routes/v1/users.routes.ts tests/feature/users.test.ts
git commit -m "feat: implement users management domain and pagination"
```

---

### Task 7: Reference Data: Offices & Designations

**Files:**
- Create: `src/validators/office.validator.ts` & `designation.validator.ts`
- Create: `src/services/office.service.ts` & `designation.service.ts`
- Create: `src/controllers/office.controller.ts` & `designation.controller.ts`
- Create: `src/routes/v1/offices.routes.ts` & `designations.routes.ts`
- Test: `tests/feature/references.test.ts`

**Step 1: Write failing test for office & designation CRUD**
**Step 2: Run test to verify failure**
**Step 3: Implement validators, services, controllers, routes**
**Step 4: Verify tests pass**
**Step 5: Commit**
```bash
git add src/validators/ src/services/ src/controllers/ src/routes/v1/ tests/feature/references.test.ts
git commit -m "feat: implement offices and designations domain"
```

---

### Task 8: Clients Domain (`/api/v1/clients`)

**Files:**
- Create: `src/validators/client.validator.ts`
- Create: `src/services/client.service.ts`
- Create: `src/controllers/client.controller.ts`
- Create: `src/routes/v1/clients.routes.ts`
- Test: `tests/feature/clients.test.ts`

**Step 1: Write failing tests for client creation with optional `user_id`**
**Step 2: Run test to verify failure**
**Step 3: Implement client validator with nullable `user_id`, `ClientService`, `ClientController`**
**Step 4: Run tests and verify 200 / 201 / 422 scenarios**
**Step 5: Commit**
```bash
git add src/validators/client.validator.ts src/services/client.service.ts src/controllers/client.controller.ts src/routes/v1/clients.routes.ts tests/feature/clients.test.ts
git commit -m "feat: implement clients domain with optional user linking"
```

---

### Task 9: Service Tickets, History & Counter Domain (`/api/v1/service-tickets`)

**Files:**
- Create: `src/validators/ticket.validator.ts`
- Create: `src/services/ticketCounter.service.ts`
- Create: `src/services/ticket.service.ts`
- Create: `src/controllers/ticket.controller.ts`
- Create: `src/routes/v1/tickets.routes.ts`
- Test: `tests/feature/tickets.test.ts`

**Step 1: Write failing feature test for ticket creation, status update, and history tracking**
```typescript
// tests/feature/tickets.test.ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

describe("Service Tickets", () => {
  it("validates required fields on create", async () => {
    const app = createApp();
    const res = await request(app).post("/api/v1/service-tickets").send({});
    expect(res.status).toBe(401); // Requires auth
  });
});
```

**Step 2: Run test to verify failure**
Run: `npx vitest run tests/feature/tickets.test.ts`
Expected: FAIL

**Step 3: Implement Ticket Domain**
- `TicketCounterService.getNextTicketNo(year, month)`: Atomic counter update returning e.g. `ST-202609-0001`.
- `TicketService.createTicket`: Wraps ticket creation, counter increment, and history log creation in `db.transaction()`.
- `TicketService.updateStatus`: Records history entry on status change.
- `TicketService.assignEngineer`: Updates engineer and logs reassignment.
- `TicketController`: Thin orchestrator.
- Mount on `/api/v1/service-tickets`.

**Step 4: Run tests to verify they pass**
Run: `npx vitest run tests/feature/tickets.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/validators/ticket.validator.ts src/services/ticket.service.ts src/services/ticketCounter.service.ts src/controllers/ticket.controller.ts src/routes/v1/tickets.routes.ts tests/feature/tickets.test.ts
git commit -m "feat: implement service tickets domain with atomic counter and history logs"
```

---

### Task 10: Notifications, Action Logs & Socket.IO Real-time Events

**Files:**
- Create: `src/realtime/socket.ts`
- Create: `src/services/notification.service.ts`
- Create: `src/services/actionLog.service.ts`
- Create: `src/controllers/notification.controller.ts`
- Create: `src/routes/v1/notifications.routes.ts`
- Create: `src/routes/v1/actionLogs.routes.ts`
- Test: `tests/feature/notifications.test.ts`

**Step 1: Write failing test for notifications endpoint**
**Step 2: Run test to verify failure**
**Step 3: Implement Socket.IO broadcasting and notification endpoints**
**Step 4: Verify tests pass**
**Step 5: Commit**
```bash
git add src/realtime/ src/services/notification.service.ts src/services/actionLog.service.ts src/controllers/notification.controller.ts src/routes/v1/notifications.routes.ts src/routes/v1/actionLogs.routes.ts tests/feature/notifications.test.ts
git commit -m "feat: implement notifications, audit action logs, and socket.io real-time events"
```

---

### Task 11: Database Seeders & End-to-End Verification

**Files:**
- Create: `src/db/seeds/index.ts`
- Create: `src/db/seeds/users.seed.ts`
- Create: `src/db/seeds/references.seed.ts`
- Create: `src/db/seeds/clients.seed.ts`
- Create: `src/db/seeds/tickets.seed.ts`
- Modify: `package.json` (add `"db:seed": "tsx src/db/seeds/index.ts"`)
- Test: Full test suite verification

**Step 1: Implement seeder scripts**
- Admin user (`admin@itsm.local` / `Admin123!`)
- Standard offices & designations
- Service engineers & staff
- Sample clients (internal and walk-in)
- Sample tickets with history logs
**Step 2: Execute seeder command against database**
Run: `npm run db:seed`
Expected: Database seeded successfully with summary output.
**Step 3: Run complete automated test suite**
Run: `npm run test`
Expected: All unit and feature tests pass with 0 errors.
**Step 4: Commit**
```bash
git add src/db/seeds/ package.json
git commit -m "feat: implement database seeders for users, references, clients, and tickets"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-09-04-itsm-backend-overhaul.md`.
Next step: run `.agent/workflows/execute-plan.md` to execute this plan task-by-task in single-flow mode.
