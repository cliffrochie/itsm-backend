# Pino-Pretty Logging Integration Design Document

**Date:** 2026-09-06  
**Feature:** Integrate `pino-pretty` for readable development logs  
**Status:** Approved  

---

## 1. Problem Statement & Context

Currently, `itsm-backend` uses `pino` and `pino-http` for structured logging. While raw JSON logging is ideal for machine consumption and log aggregators in production, it is difficult to read during local development and debugging in the terminal.

The goal is to integrate `pino-pretty` so that log output is formatted, colored, and human-readable during local development without compromising production structured JSON logging or cluttering test runs.

---

## 2. Design Decisions & Scope

1. **Environment-Targeted Formatting**:
   - **Development (`NODE_ENV === "development"` or unset)**: Enable `pino-pretty` formatting with timestamp, level colorization, and omitted machine metadata (`pid`, `hostname`).
   - **Production (`NODE_ENV === "production"`)**: Maintain raw JSON output without pretty formatting for low-overhead, machine-parseable logs.
   - **Test (`NODE_ENV === "test"`)**: Retain `level: "silent"` so test execution outputs remain uncluttered.

2. **In-Process Pino Transport**:
   - Use Pino's built-in `transport` configuration rather than shell CLI pipes (`| pino-pretty`).
   - Ensures cross-platform compatibility across Windows (PowerShell/CMD), macOS, and Linux.
   - Avoids pipe-related signal propagation issues (e.g. hung processes on port 5000 upon `Ctrl+C`).

3. **Preservation of Security Serializers**:
   - Retain the existing strict allowlist serializers for `req`, `res`, and `err` in `src/config/logger.ts`.
   - Ensure sensitive headers (e.g., `Authorization`, `Cookie`) and request bodies are never emitted to logs in any environment.

---

## 3. Technical Changes

### Dependencies
- Add `pino-pretty` to `dependencies` (or `devDependencies`). Adding to `dependencies` ensures compatibility in any container or environment that runs under development mode.

### Logger Configuration (`src/config/logger.ts`)
- Check if environment is development:
  ```typescript
  const isDev = (process.env.NODE_ENV ?? "development") === "development";
  ```
- Configure `transport` in `pino(...)`:
  ```typescript
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
  ```

---

## 4. Verification & Testing

1. **Unit Tests**:
   - Update `tests/unit/logger.test.ts` to verify that the logger configuration works under `NODE_ENV=test` (silent) and does not regress serialization rules.
   - Test transport behavior when `NODE_ENV=development`.
2. **Regression Suite**:
   - Run `npm test` across all unit and feature tests to confirm zero regressions.
3. **Manual Verification**:
   - Start or invoke logger in development mode to visually confirm human-readable formatted output.
