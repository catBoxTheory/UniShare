# UniShare

An open-access platform for university students to share course materials and lecture videos — a free alternative to StuDocu and CourseHero. No paywalls, no blurred content. Just students helping students.

## Features

### Course Management
- **Course creation** — Create courses with code and title, organized by university and department
- **Document sharing** — Upload PDFs, notebooks, CSVs, Python files, presentations with S3 storage
- **Video sharing** — Paste YouTube URLs or upload videos directly; thumbnails auto-fetched from YouTube
- **Folder organization** — Drag-and-drop materials into folders; inline rename and delete
- **Material type tags** — Materials tagged as Lecture, Extra, File, or Video with color-coded badges

### Discovery & Engagement
- **Global search** — `Cmd+K` instant search with keyboard-navigable dropdown results
- **Dashboard stats** — Enrolled courses, total materials, new this week, ratings given at a glance
- **Trending courses** — Top courses by recent material activity
- **Leaderboard** — Top courses ranked by material count
- **"New since last visit"** — See what's new in your enrolled courses since you last checked

### Quality & Feedback
- **Star ratings** — Rate materials 1-5 stars; see average rating and count
- **Threaded comments** — Discuss individual materials; reply to comments inline
- **Bookmark materials** — Save individual materials for quick access from the Saved tab

### Personalization
- **Study progress tracking** — Track which materials you've viewed and completed per course
- **Private notes** — Attach personal notes to any material; auto-saves as you type
- **Enrollment** — Add courses to your library for quick access

### UX
- **Bilingual subtitles** — English and Chinese subtitles for YouTube videos via AI transcription
- **Dark mode** — System-aware light/dark theme with warm earth and emerald palette
- **Mobile bottom tab bar** — Optimized navigation on small screens
- **In-app notifications** — Notified when new materials are added to your enrolled courses
- **Onboarding flow** — University, region, and start year setup for new users

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router, TypeScript, React 18 |
| Styling | Tailwind CSS v3, shadcn/ui (Radix primitives), Framer Motion |
| Database | PostgreSQL via Prisma 7 with Pg adapter |
| Auth | NextAuth.js v5 — Credentials + Google OAuth, JWT sessions |
| Storage | S3-compatible (Cloudflare R2 in production, MinIO locally) |
| Video | react-player, YouTube IFrame API, youtube-transcript |
| AI | Groq SDK (transcription), external audio service for AI transcription |
| Email | Nodemailer via Gmail SMTP (verification codes) |
| Forms | react-hook-form + zod validation |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop (for local PostgreSQL + MinIO)

### Setup

```bash
# Install dependencies
npm install

# Start local infrastructure (PostgreSQL + MinIO + pgAdmin)
docker-compose up -d

# Push database schema
npx prisma db push

# Start dev server (port 3001)
npm run dev
```

Local services:
- **App:** http://localhost:3001
- **pgAdmin:** http://localhost:5050
- **MinIO Console:** http://localhost:9001

### Environment Variables

Copy `.env.example` to `.env` and configure:

```
DATABASE_URL=postgresql://...             # PostgreSQL connection
AUTH_SECRET=                              # NextAuth encryption key
NEXTAUTH_URL=http://localhost:3001        # Auth callback URL
GOOGLE_CLIENT_ID=                         # Google OAuth credentials
GOOGLE_CLIENT_SECRET=
STORAGE_ENDPOINT=                         # S3-compatible storage
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET_NAME=
STORAGE_PUBLIC_URL=
SMTP_HOST=                                # Email (Gmail SMTP)
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
SITE_PASSWORD=                            # Optional: site-wide access password
```

## Project Structure

```
app/
  actions/          Server actions (CRUD, auth, ratings, bookmarks, etc.)
  api/              API routes (upload, YouTube, proxy, auth)
  courses/[id]/     Course detail page + watch page
  search/           Course search/browse
  signin/           Authentication pages
  register/
  onboarding/
  settings/
  globals.css       Design tokens, utilities

components/
  course/           Course cards, rating widget, comments, progress, notes
  documents/        Document upload, preview, listing
  video/            Video player, subtitle overlay, YouTube integration
  layout/           Navbar, Sidebar, Topbar, SearchBar, BottomTabBar
  home/             Dashboard, MarketingPage
  ui/               shadcn/ui primitives (button, dialog, pagination, etc.)
  theme/            Theme provider, theme toggle

prisma/
  schema.prisma     Database schema (14 models, 2 enums)

lib/
  prisma.ts         Prisma client singleton
  storage.ts        S3/MinIO storage helpers
  utils.ts          Utility functions (cn, etc.)
```

## Key Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm start             # Start production server
npm run lint          # Run ESLint
npx prisma generate   # Regenerate Prisma client after schema changes
npx prisma db push    # Push schema changes to database
npx prisma studio     # Open Prisma Studio (database GUI)
docker-compose up -d  # Start local PostgreSQL + MinIO
docker-compose down   # Stop local infrastructure
```

## License

MIT
