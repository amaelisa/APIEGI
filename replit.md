# Assistant Pédagogique Intelligent — IA-GI

A pedagogical assistant web app for Computer Engineering (Génie Informatique) students: email-confirmed accounts, 68 subjects across L1/L2/L3 levels, AI chat powered by Gemini, dark mode.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the Express API server (port varies, set by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (if using Replit DB)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + react-router-dom v7 + react-markdown
- API: FastAPI (Python) — external backend, not in this repo
- Auth: Custom JWT via FastAPI + Supabase email confirmation
- DB: Supabase PostgreSQL (external)
- AI: Google Gemini 1.5 Flash (via FastAPI backend)
- Build: Vite

## Where things live

- `artifacts/assistant-gi/` — the React + Vite frontend (previewed at `/`)
- `artifacts/assistant-gi/src/api/client.ts` — all API calls to the FastAPI backend
- `artifacts/assistant-gi/src/context/AuthContext.tsx` — authentication state
- `artifacts/assistant-gi/src/pages/` — Login, Register, ChatApp
- `artifacts/assistant-gi/src/components/` — Sidebar, ChatArea, Logo, SendIcon
- `artifacts/assistant-gi/public/assets/logo.png` — university logo

## Architecture decisions

- The backend is a Python FastAPI app (`.migration-backup/app/`) — not ported to Express. The frontend calls it via `VITE_API_URL`.
- Auth is JWT-based with Supabase email OTP confirmation (8-digit code). No Supabase JS SDK on the frontend — all auth goes through the FastAPI backend.
- `react-router-dom` v7 (not wouter) because the original app used it and all routes were already defined.
- The frontend is purely client-rendered (SPA), served as a static Vite build.

## Product

- Students register with email → confirm with 8-digit OTP code
- After login: browse 68 subjects organized by level (L1, L2, L3)
- Chat with Gemini AI scoped to the selected subject
- PDF upload support for document analysis
- Persistent chat history per subject

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The backend (FastAPI) must be deployed separately — it is not included in this Replit workspace. Set `VITE_API_URL` to point to it.
- Supabase email OTP has a rate limit (~4 emails/hour on the free plan).
- The app talks to `/api/auth/*`, `/api/matieres`, `/api/chat`, `/health` on the backend.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
