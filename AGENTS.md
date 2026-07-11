# Project Context

## Database Schema

See `back/README.md` for full schema, enums (`eventProgress`), and table definitions.

## Tech Stack

- **Backend:** Node.js + Express 4, TypeScript, raw SQL (mysql2/promise, no ORM)
- **Frontend:** Angular 17, SCSS, Module Federation (micro-frontend)
- **Shared types:** `contracts/` directory — `@contracts/*` alias in both back/ and web/
- **Validation:** `typia` (compile-time)
- **Auth:** JWT Bearer token in `Authorization` header
- **External services:** `tik@` (event broadcasting/SSE), `au` (auth MFE)

## Commands

```bash
# Backend
cd back && npm start          # dev server on :3201
cd back && npm run build      # tsc

# Frontend
cd web && npm start           # dev server on :4201
cd web && npm run build       # ng build
```

## Key Conventions

- **Response shape:** `Res<TData, TDebug, TError>` from `contracts/contracts.base.ts`
- **Controllers:** class-based, static methods, one dir per domain (e.g. `event.controller/`)
- **Routes:** thin — validate (typia) → call controller → respond JSON
- **DB queries:** raw SQL in `back/db-actions/`, filenames like `get-event.db.ts`
- **Logging:** use `dd()` not `console.log`
- **Naming:** files kebab-case, types PascalCase, DB columns snake_case
- **No tests** currently
