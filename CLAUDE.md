# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Identity

UniShare (package: `unishare`) is an open-access platform for university students to share course materials and lecture videos — a free alternative to StuDocu/CourseHero. No paywalls, no blurred content.

## Commands

```bash
npm run dev          # Start dev server on port 3001
npm run build        # Generate Prisma client + Next.js production build
npm start            # Start production server
npm run lint         # ESLint

# Rebuild Prisma client after schema changes
npx prisma generate

# Push schema changes to dev database (prototyping only — use migrations in production)
npx prisma db push
```

Local infrastructure (PostgreSQL + MinIO + pgAdmin) is managed via Docker Compose:
```bash
docker-compose up -d           # Start local DB & storage
docker-compose down            # Stop
```

## Tech Stack

- **Framework:** Next.js 14 App Router, TypeScript, React 18
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives), `framer-motion` for animations
- **Database:** PostgreSQL via Prisma 7 with `@prisma/adapter-pg` (Pg pool)
- **Auth:** NextAuth.js v5 (Auth.js) — Credentials provider + Google OAuth, JWT sessions (no DB sessions), Prisma adapter
- **Storage:** S3-compatible via `@aws-sdk/client-s3` — Cloudflare R2 (production) or MinIO (local dev, `docker-compose.yml`)
- **Video:** `react-player`, `youtube-transcript`, Groq SDK (AI features)
- **Email:** `nodemailer` via Gmail SMTP for verification codes

## Architecture

### Server Actions are the primary data layer

Most CRUD operations go through server actions in `app/actions/`, not API routes. Every server action that modifies data calls `revalidatePath()` to invalidate the Next.js client-side cache. Server actions use `auth()` from `@/auth` to get the current session.

| File | Purpose |
|---|---|
| `app/actions/courses.ts` | Course CRUD, enrollment toggle, recent views |
| `app/actions/folders.ts` | Folder creation, folder contents listing, breadcrumb path |
| `app/actions/materials.ts` | Save material to DB, YouTube video validation/save |
| `app/actions/files.ts` | File fetch, delete (from DB + storage), related files |
| `app/actions/transcripts.ts` | Subtitle fetching, AI transcription, Chinese translation |
| `app/actions/auth.ts` | Sign-in, sign-up, password reset, Google OAuth |
| `app/actions/register.ts` | Registration flow |
| `app/actions/verification.ts` | Email verification token management |
| `app/actions/user.ts` | User profile updates |
| `app/actions/contact.ts` | Contact form submission with zod validation |

### API Routes (narrower scope)

Only used for operations that don't fit server actions:
- `app/api/auth/[...nextauth]/` — NextAuth handler
- `app/api/upload/` and `app/api/upload/presigned/` — File upload (direct + presigned URLs)
- `app/api/files/[fileId]/` — File CRUD
- `app/api/folders/` — Folder CRUD
- `app/api/videos/` — Video listing
- `app/api/youtube/` — YouTube metadata and transcription
- `app/api/proxy/[...path]/` — Proxies storage requests (S3 signed URLs)

### Database Schema

PostgreSQL with Prisma ORM. Key models:

- **University → Department → Course** — hierarchical academic structure. University has unique `name` and `slug`; Department is unique per `(universityId, slug)`; Course is unique per `(departmentId, code)`.
- **Folder** — self-referential via `parentId` (Prisma relation `FolderToFolder` with cascade delete). Linked to a Course. Has `type` enum: `DOCUMENT` | `VIDEO`.
- **Material** — belongs to Course, optionally linked to a Folder. Has `type` enum: `LECTURE` | `EXTRA` | `FILE` | `VIDEO`. Stores the `url` pointing to S3/R2 storage.
- **User** — Auth.js user with onboarding fields (`universityId`, `region`, `startYear`, `isOnboardingCompleted`).
- **Enrollment** — many-to-many User↔Course, unique per `(userId, courseId)`.
- **RecentView** — tracks last viewed course per user, unique per `(userId, courseId)`, upserted on each view.

### Authentication Flow

1. `auth.ts` configures NextAuth with JWT strategy, Prisma adapter, Credentials (email + bcrypt password) and Google providers.
2. `auth.config.ts` sets custom sign-in page at `/signin`.
3. `middleware.ts` has TWO layers: (a) static asset bypass, (b) site-wide SITE_PASSWORD cookie gate for staging protection.
4. Server components call `const session = await auth()` to check auth status and redirect.
5. Client components use `useSession()` from `next-auth/react` (wrapped by `SessionProvider` in root layout).
6. JWT callback refreshes `isOnboardingCompleted` from DB on every token refresh.

### Routing & Pages

```
/                    → MarketingPage (unauthenticated) or Dashboard (authenticated)
/signin              → SignInForm
/register            → Registration form with Google OAuth + email, university dropdown
/onboarding          → OnboardingForm (university, region, start year)
/courses/[courseId]  → Course dashboard with tabs (server component)
/courses/[courseId]/watch → Video watch page (server component)
/search              → Course search/browse
/settings            → User settings
/enter-password      → Site-wide password gate page
/contact             → Contact form page
/privacy             → Privacy policy page
/terms               → Terms of service page
```

### Storage Layer (`lib/storage.ts`)

- Uses `@aws-sdk/client-s3` with `forcePathStyle: true` (required for Cloudflare R2).
- Supports both S3-style endpoints and R2 custom domains.
- Provides `getPresignedUploadUrl()` for direct-to-storage uploads, `uploadFileToMinio()` for server-side uploads, and `deleteFileFromMinio()`.
- Public URLs are either the R2.dev domain or back-computed from the endpoint/bucket.

### Prisma Client (`lib/prisma.ts`)

Uses `@prisma/adapter-pg` with a `pg.Pool` connection (not the default Prisma binary driver). Singleton pattern via `globalThis` in dev to prevent hot-reload connection exhaustion.

### Onboarding Gate

The home page (`app/page.tsx`) checks `user.isOnboardingCompleted` and redirects to `/onboarding` if false. This gate prevents users from accessing the dashboard until they complete onboarding.

## Design System

The project uses a warm earth + emerald palette defined as HSL custom properties in `app/globals.css` (light and dark mode). Key conventions:

- **Typography**: Inter for body, EB Garamond (`font-serif`) for headings. Headings use `tracking-tighter leading-tight`.
- **Color**: Emerald green accent (`--primary: 150 30% 35%`), warm stone neutrals. No purple/blue gradients, no pure `#000000`.
- **"Liquid Glass"**: Cards and elevated surfaces use `backdrop-blur` + `border border-white/10` + `shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]` for a premium frosted glass effect.
- **Layout**: No centered hero sections — left-aligned content. No 3-column card grids — use asymmetric or zig-zag layouts instead.
- **Components**: `shadcn/ui` primitives in `components/ui/`, customized to match the warm earth palette via CSS variables.

## Environment Variables

All set in `.env`. Key variables:

- `DATABASE_URL` — PostgreSQL connection string (Neon.tech for production)
- `AUTH_SECRET`, `NEXTAUTH_URL` — NextAuth configuration
- `SITE_PASSWORD` — If set, middleware requires this cookie to access any page
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth
- `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET_NAME`, `STORAGE_PUBLIC_URL` — S3-compatible storage
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` — Email

## Key Patterns

- **Client/Server component split**: Pages that fetch data are server components. Interactive components (forms, modals) are client components using `"use client"`.
- **Cache invalidation**: Server actions use `revalidatePath()`; client-side mutations additionally call `router.refresh()`.
- **shadcn/ui**: Components live in `components/ui/`, generated by `components.json` config. Use `cn()` from `lib/utils.ts` for class merging.
- **Docker Compose** provides PostgreSQL on 5432, MinIO on 9000 (API) / 9001 (console), pgAdmin on 5050.
- **No database sessions**: NextAuth uses JWT strategy, so no session table writes per request.
