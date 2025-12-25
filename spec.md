# 1. Project Overview

**Name:** UniShare (University Resource Hub)

**Goal:** An open-access platform for students to share course materials and lecture videos.

**Target:** Cross-platform responsive web app (Mobile & Desktop).

# 2. Tech Stack

**Framework:** Next.js 14 (App Router, TypeScript).

**Styling:** Tailwind CSS + Shadcn UI (for the clean, academic look).

**Database:** PostgreSQL (via Prisma ORM) with self-hosted connection.

**Authentication:** NextAuth.js v5 (Credentials Provider).

**Storage:** MinIO (Self-hosted S3-compatible object storage).

**Video:** react-player for streaming.

# 3. Core Features & Data Modeling

**Course Organization:** Hierarchy of University > Department > Course.

**Recursive File System:**
*   **Structure:** A "User-Defined File System" replacing strict categories.
*   **Entities:**
    *   **Folder:** Can contain `Files` and `Sub-Folders`.
    *   **File:** The actual resource (PDF, Video, etc.).
*   **Logic:**
    *   Self-referential relationship (`parentId` in Folder) allows infinite nesting (e.g., Course Root > Week 1 > Videos > Video.mp4).
    *   Root Folders are directly linked to a `Course`.

**Upload & Management:**
*   **"New Folder":** Create a named directory in the current view.
*   **"Upload Here":** Upload files directly to the current folder ID.

**Video Interface:**
*   **"Theater Mode":** Video player takes up 70% width (top on mobile).
*   **"Playlist Sidebar":** Dynamic list based on the current folder's contents.

# 4. UX/UI Rules

**Dashboard:**
*   **File Explorer:** A Google Drive / MacOS Finder style interface.
*   **Navigation:** Dynamic Breadcrumbs (Home > CS101 > Midterms > Cheat Sheets).

**Style:** Minimalist, data-heavy but clean (Reference: StuDocu/CourseHero).

**Access:** No paywalls, no blurring (Open Access Policy).

**Mobile:** Fully responsive. The sidebar must collapse into a drawer or move below content on small screens.

# 5. Implementation Phases

**Phase 1:** Project Scaffold & Database Schema (Completed).

**Phase 2:** Core Components (Video Player, Upload Form) (Completed).

**Phase 3:** Pages & Routing (Completed).

**Phase 4:** Landing Page (Completed).

**Phase 5:** Refactor to Recursive File System (Current).
