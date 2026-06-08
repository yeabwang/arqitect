# Getting Started

## Prerequisites

- Node.js compatible with Next.js 16 and React 19.
- PostgreSQL or Prisma Postgres.
- Clerk app.
- Liveblocks app.
- Trigger.dev project.
- Vercel Blob token.
- Requesty API key for AI model access.

## Install

```bash
npm install
npx prisma generate
```

Prisma is configured through `prisma.config.ts`. The schema root is `prisma/`, with models split across `prisma/models/*.prisma`.

## Environment

Create `.env.local` for local development. These are the variables the code or platform SDKs use:

| Variable | Required | Used by |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Prisma datasource and production runtime |
| `DIRECT_DATABASE_URL` | Local optional | Direct development DB URL preferred by `lib/prisma.ts` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk client |
| `CLERK_SECRET_KEY` | Yes | Clerk server auth |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Optional | `proxy.ts` fallback is `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Optional | `proxy.ts` fallback is `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Optional | Clerk redirect config |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Optional | Clerk redirect config |
| `LIVEBLOCKS_SECRET_KEY` | Yes | Liveblocks room auth and Trigger tasks |
| `BLOB_READ_WRITE_TOKEN` | Yes | `@vercel/blob` uploads/downloads |
| `TRIGGER_PROJECT_REF` | Yes | `trigger.config.ts` |
| `TRIGGER_SECRET_KEY` | Yes | Trigger SDK/CLI |
| `REQUESTY_API_KEY` | Yes | AI model provider |
| `REQUESTY_DESIGN_MODEL` | Design AI | Canvas design task and onboarding fallback |
| `REQUESTY_ONBOARDING_MODEL` | Onboarding AI | Conversational onboarding route |
| `REQUESTY_SPEC_MODEL` | Optional | Spec generation task fallback is Gemini 2.5 Flash |
| `ONBOARDING_MAX_TRANSCRIPT` | Optional | Onboarding turn backstop |
| `ONBOARDING_MAX_FIELD_CHARS` | Optional | Onboarding field limit |
| `ONBOARDING_TURN_TEMPERATURE` | Optional | Onboarding turn temperature |
| `ONBOARDING_SUMMARY_TEMPERATURE` | Optional | Onboarding summary temperature |

`LIVEBLOCKS_PUBLICK_KEY` appears in local env files but is not read by the current codebase.

## Database

```bash
npx prisma generate
npx prisma migrate deploy
```

`lib/prisma.ts` chooses DB URLs this way:

- Production: `DATABASE_URL`.
- Development: `DIRECT_DATABASE_URL`, then `.env.local` direct/database URL, then `DATABASE_URL`.

For Prisma Postgres direct URLs, the pg adapter pool is serialized to one connection and read operations retry transient connection failures.

## Local Servers

```bash
npm run dev
npm run trigger:dev
```

Run both when testing AI generation or spec generation. `npm run dev` starts the Next.js app. `npm run trigger:dev` starts Trigger.dev workers for `trigger/design-agent.ts` and `trigger/generate-spec.ts`.

## Checks

```bash
npx tsc --noEmit
npm run lint
npm run build
```

No package script exists for tests. The repo has `node:test` files in `lib/`, `types/`, and `components/landing/`.
