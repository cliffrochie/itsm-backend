# Pino-Pretty Logging Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Integrate `pino-pretty` to provide human-readable, colorized terminal logs during local development while keeping raw JSON in production and silent output in test.

**Architecture:** Use Pino's native in-process transport mechanism conditionally enabled when `NODE_ENV === "development"` (or default), maintaining the strict serializer allowlist for request and response data.

**Tech Stack:** Node.js, TypeScript, Pino v9, pino-pretty, Vitest.

---

### Task 1: Install `pino-pretty`

**Files:**
- Modify: `package.json`

**Step 1: Install dependency**

Run:
```bash
npm install pino-pretty
```

**Step 2: Verify installation**

Run:
```bash
npm list pino-pretty
```
Expected: `pino-pretty@^...` installed.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add pino-pretty dependency"
```

---

### Task 2: Configure In-Process Transport in Logger

**Files:**
- Modify: `src/config/logger.ts`

**Step 1: Write configuration**

Update `src/config/logger.ts` to configure `transport` conditionally when `isDev`:
```typescript
const isDev = (process.env.NODE_ENV ?? "development") === "development";

export const logger = pino({
  level: resolveLevel(),
  base: { service: "itsm-backend" },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req(req: { id?: unknown; method?: string; url?: string; remoteAddress?: string }) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res: { statusCode?: number }) {
      return { statusCode: res.statusCode };
    },
    err: pino.stdSerializers.err,
  },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});
```

**Step 2: Verify test environment isolation**

Run:
```bash
npx vitest run tests/unit/logger.test.ts
```
Expected: All tests pass and logger remains silent under `NODE_ENV=test`.

**Step 3: Commit**

```bash
git add src/config/logger.ts
git commit -m "feat: configure pino-pretty transport in development mode"
```

---

### Task 3: Enhance Logger Unit Tests

**Files:**
- Modify: `tests/unit/logger.test.ts`

**Step 1: Write new unit test**

Add unit tests to `tests/unit/logger.test.ts` asserting that `logger` remains silent under `test` and that serializers and base configurations are intact.

**Step 2: Run logger unit tests**

Run:
```bash
npx vitest run tests/unit/logger.test.ts
```
Expected: PASS.

**Step 3: Commit**

```bash
git add tests/unit/logger.test.ts
git commit -m "test: verify logger configuration and test silence"
```

---

### Task 4: Full Regression and Manual Smoke Verification

**Files:**
- N/A

**Step 1: Run complete test suite**

Run:
```bash
npm test
```
Expected: All 27 test files pass.

**Step 2: Manual smoke test in development mode**

Run:
```bash
npx tsx -e "import { logger } from './src/config/logger'; logger.info({ user: 'test' }, 'Test pretty log output');"
```
Expected: Formatted, colorized log line in terminal.

**Step 3: Update documentation and tracker**

Update `docs/plans/task.md` to reflect task completion.
