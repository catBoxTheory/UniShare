# UniShare

An open-access platform for university students to share course materials and lecture videos. No paywalls, no blurred content — just students helping students.

## Tech Stack

- **Framework:** Next.js 14 App Router, TypeScript, React 18
- **Styling:** Tailwind CSS + shadcn/ui, Framer Motion
- **Database:** PostgreSQL via Prisma
- **Auth:** NextAuth.js v5 (Credentials + Google OAuth)
- **Storage:** S3-compatible (Cloudflare R2 / MinIO)

## Getting Started

```bash
npm install
docker-compose up -d    # PostgreSQL + MinIO + pgAdmin
npx prisma db push      # Apply schema to local DB
npm run dev             # Start on port 3001
```

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `app/actions/` | Server actions (CRUD, auth) |
| `app/api/` | API routes (upload, YouTube, auth) |
| `components/ui/` | shadcn/ui primitives |
| `components/course/` | Course dashboard components |
| `components/layout/` | Navbar, Footer, Sidebar, Topbar |
| `components/video/` | Video player and subtitle components |
| `lib/` | Prisma client, storage, mail, utilities |
| `prisma/` | Database schema and migrations |
