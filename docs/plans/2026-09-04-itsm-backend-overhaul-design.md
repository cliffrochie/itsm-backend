# ITSM Backend Overhaul Design Document

**Date:** 2026-09-04  
**Project:** itsm-backend  
**Status:** Approved  
**Blueprint Reference:** `spec-vault/blueprint/dev-guidelines/backend-node.md` & `api-contract.md`

---

## 1. Overview & Objective

Overhaul `itsm-backend` from Express 4 + Mongoose (MongoDB) to a robust, layered architecture built on **Express 5 (TypeScript)**, **Drizzle ORM (MySQL)**, **Zod**, and **Vitest**, adhering 100% to the organizational blueprint guidelines.

The overhaul will be constructed in an isolated Git worktree on branch `refactor/v2-blueprint-overhaul`, using a fresh schema with comprehensive seeders, and adopting strict `/api/v1/` endpoint contracts and response envelopes.

---

## 2. Technology Stack

| Category | Technology |
| :--- | :--- |
| **Runtime & Language** | Node.js (LTS), TypeScript (`tsconfig` strict mode) |
| **Framework** | Express 5 |
| **ORM & Database** | Drizzle ORM (`drizzle-orm` + `mysql2`), MySQL 8 |
| **Schema & Migration Tools** | `drizzle-kit` (`generate`, `migrate`, `studio`) |
| **Validation** | Zod (Request payload, query params, and environment variables) |
| **Authentication** | Custom JWT Bearer tokens (Parity with Sanctum / API Contract) |
| **Password Hashing** | `bcrypt` |
| **Real-time** | Socket.IO |
| **Security & Utilities** | `helmet`, `cors`, `pino`, `pino-http`, `express-rate-limit` |
| **Testing** | Vitest + Supertest |

---

## 3. Database Schema Design (MySQL + Drizzle)

All tables follow `snake_case` plural naming, auto-increment integer IDs, `{table_singular}_id` foreign keys, `is_*` boolean prefixes, and `created_at` / `updated_at` timestamps.

### 3.1 Entities

1. **`users`**
   * `id`: `serial` primary key
   * `username`: `varchar(100)` unique
   * `email`: `varchar(191)` unique
   * `password`: `varchar(255)` (bcrypt hash)
   * `first_name`, `middle_name`, `last_name`, `extension_name`: `varchar(100)` (auto-uppercased)
   * `contact_no`: `varchar(50)` nullable
   * `avatar`: `varchar(255)` nullable
   * `role`: `enum('admin', 'service_engineer', 'staff', 'user')` default `'user'`
   * `is_active`: `boolean` default `false`
   * `created_at`, `updated_at`

2. **`offices`**
   * `id`: `serial` primary key
   * `name`: `varchar(150)`
   * `code`: `varchar(50)` unique
   * `created_at`, `updated_at`

3. **`designations`**
   * `id`: `serial` primary key
   * `name`: `varchar(150)`
   * `created_at`, `updated_at`

4. **`clients`**
   * `id`: `serial` primary key
   * `first_name`, `middle_name`, `last_name`, `extension_name`: `varchar(100)`
   * `contact_no`: `varchar(50)`
   * `office_id`: `bigint unsigned` foreign key -> `offices.id`
   * `designation_id`: `bigint unsigned` foreign key -> `designations.id`
   * `user_id`: `bigint unsigned` foreign key -> `users.id` nullable (links internal users acting as clients)
   * `created_at`, `updated_at`

5. **`service_tickets`**
   * `id`: `serial` primary key
   * `ticket_no`: `varchar(50)` unique (sequential generation via `ticket_counters`)
   * `task_type`: `varchar(100)`
   * `title`: `varchar(255)`
   * `nature_of_work`: `text`
   * `serial_no`: `varchar(100)` nullable
   * `equipment_type`: `varchar(100)` nullable
   * `equipment_type_others`: `varchar(255)` nullable
   * `defects_found`: `text` nullable
   * `service_rendered`: `text` nullable
   * `service_status`: `enum('open', 'in_progress', 'resolved', 'closed', 'cancelled')` default `'open'`
   * `priority`: `enum('low', 'medium', 'high', 'urgent')` default `'low'`
   * `remarks`: `text` nullable
   * `admin_remarks`: `text` nullable
   * `rating`: `tinyint` nullable
   * `rating_comment`: `text` nullable
   * `client_id`: `bigint unsigned` foreign key -> `clients.id` nullable
   * `service_engineer_id`: `bigint unsigned` foreign key -> `users.id` nullable
   * `created_by_id`: `bigint unsigned` foreign key -> `users.id` nullable
   * `updated_by_id`: `bigint unsigned` foreign key -> `users.id` nullable
   * `created_at`, `updated_at`

6. **`service_ticket_histories`**
   * `id`: `serial` primary key
   * `service_ticket_id`: `bigint unsigned` foreign key -> `service_tickets.id`
   * `performed_by_id`: `bigint unsigned` foreign key -> `users.id` nullable
   * `action`: `varchar(100)`
   * `notes`: `text` nullable
   * `created_at`

7. **`ticket_counters`**
   * `id`: `serial` primary key
   * `year`: `smallint`
   * `month`: `tinyint`
   * `last_count`: `int` default `0`
   * `updated_at`

8. **`notifications`**
   * `id`: `serial` primary key
   * `user_id`: `bigint unsigned` foreign key -> `users.id`
   * `ticket_id`: `bigint unsigned` foreign key -> `service_tickets.id` nullable
   * `title`: `varchar(255)`
   * `message`: `text`
   * `is_read`: `boolean` default `false`
   * `created_at`

9. **`action_logs`**
   * `id`: `serial` primary key
   * `user_id`: `bigint unsigned` foreign key -> `users.id` nullable
   * `action`: `varchar(100)`
   * `entity`: `varchar(100)`
   * `entity_id`: `varchar(100)` nullable
   * `details`: `json` nullable
   * `ip_address`: `varchar(45)` nullable
   * `created_at`

---

## 4. Layered Architecture & Directory Layout

```text
src/
├── authorization/       # Per-domain policy guards (canManageTicket, canUpdateUser)
├── config/
│   └── env.ts           # Strict Zod-validated environment config
├── controllers/         # Thin handlers (validate -> authorize -> service -> mapResponse)
├── db/
│   ├── client.ts        # Shared Drizzle connection pool
│   ├── schema/          # Drizzle table schemas per domain (*.ts)
│   ├── migrations/      # Drizzle-kit generated SQL migrations
│   └── seeds/           # Database seed scripts
├── middlewares/         # authenticate, authorize, validate, errorHandler, rateLimiter
├── responses/           # Serializers mapping raw DB entities to clean API contract shapes
├── routes/
│   └── v1/              # *.routes.ts files grouped by domain
├── services/            # Business logic & atomic DB transactions
├── types/               # Shared DTOs and entity interfaces
├── app.ts               # Express application setup
└── index.ts             # Server entry point & Socket.IO initialization
tests/
├── unit/                # Validators, utilities, business rules
└── feature/             # Supertest HTTP integration tests against test DB
```

---

## 5. API Contract & Envelope Specification

All endpoints are mounted under `/api/v1/` and output the standard JSON envelope:

### Success Response (200 / 201)
```json
{
  "data": { ... },
  "message": "Resource created successfully.",
  "errors": null
}
```

### Paginated Response (200)
```json
{
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 72
  },
  "message": "Resources retrieved successfully.",
  "errors": null
}
```

### Validation Error (422)
```json
{
  "data": null,
  "message": "Validation failed.",
  "errors": {
    "email": ["Invalid email address format."]
  }
}
```

### Authentication / Authorization / Server Error (401 / 403 / 500)
```json
{
  "data": null,
  "message": "Unauthenticated.",
  "errors": null
}
```

---

## 6. Seeders & Initial Data

The `npm run db:seed` command populates:
1. Default Administrator (`admin@itsm.local` / `Admin123!`)
2. Initial Offices (IT Support, Human Resources, Finance, Operations)
3. Initial Designations (IT Specialist, Systems Administrator, Administrative Officer)
4. Sample Service Engineers & Staff Users
5. Sample Client linked to an internal user + Walk-in Client
6. Sample Service Tickets with history entries and ticket counter
