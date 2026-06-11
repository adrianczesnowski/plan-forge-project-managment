# PlanForge

Open-source project management platform — a modern, self-hosted alternative to Microsoft Project and ClickUp. Built with TypeScript end-to-end.

## Stack

- **Backend:** NestJS, Prisma, PostgreSQL, Zod
- **Frontend:** React 19, Vite, Tailwind CSS v4, TanStack Query, Zustand, react-i18next (PL/EN)
- **Monorepo:** Turborepo + npm workspaces

## Structure

```
apps/
  backend/    NestJS API (REST, JWT auth + refresh cookie)
  frontend/   React SPA (Vite)
packages/
  shared/     Shared TypeScript types + Zod validators (the API contract)
```

## Getting started

Requirements: Node.js ≥ 22, Docker.

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
npm run db:up

# 3. Configure the backend
cp apps/backend/.env.example apps/backend/.env

# 4. Apply database migrations
npm run db:migrate

# 5. Run everything in dev mode
npm run dev
```

- API: http://localhost:3000/api
- Frontend: http://localhost:5173

## Conventions

- Every API response uses the `{ success, data | error, timestamp }` envelope (`TransformInterceptor` / `HttpExceptionFilter`).
- All backend messages are English-only constants in `apps/backend/src/common/constants/messages.ts`; the frontend translates them via the `errors` i18n namespace.
- Request validation uses Zod schemas from `@planforge/shared` on both sides of the wire.

## License

MIT
