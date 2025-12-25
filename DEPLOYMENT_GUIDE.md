# UniShare Cloudflare Deployment Guide

Follow these steps to deploy your website to Cloudflare for free.

## 1. Cloudflare R2 Setup (File Storage)
1. Go to **R2** in Cloudflare Dashboard.
2. **Create Bucket**: Name it `unishare-bucket`.
3. **Public Access**: Go to the bucket settings and enable "R2.dev subdomain" or connect your own subdomain (e.g., `files.unishare.dpdns.org`).
4. **API Tokens**: Go to "Manage R2 API Tokens" -> "Create API Token".
   - Permissions: **Edit**.
   - Copy the **Access Key ID**, **Secret Access Key**, and the **S3 Endpoint**.

## 2. Cloudflare Pages Setup (Website)
1. Connect your GitHub repository to Cloudflare Pages.
2. **Build Settings**:
   - Framework preset: `Next.js`
   - Build command: `npx prisma generate && next build`
   - Root directory: `/`
3. **Environment Variables** (Add these in the "Settings" -> "Environment Variables" section of your Pages project):
   - `DATABASE_URL`: (Your Neon connection string)
   - `AUTH_SECRET`: (Generated randomly, check your local .env)
   - `NEXTAUTH_URL`: `https://unishare.dpdns.org`
   - `GOOGLE_CLIENT_ID`: (Your Google ID)
   - `GOOGLE_CLIENT_SECRET`: (Your Google Secret)
   - `STORAGE_ENDPOINT`: (The S3 endpoint from R2)
   - `STORAGE_ACCESS_KEY`: (From R2 token)
   - `STORAGE_SECRET_KEY`: (From R2 token)
   - `STORAGE_BUCKET_NAME`: `unishare-bucket`
   - `STORAGE_PUBLIC_URL`: (Your R2.dev URL or custom subdomain)
   - `NODE_VERSION`: `20`
   - `NEXT_OTEL_FETCH_DISABLED`: `1`

## 3. Cloudflare Zero Trust (Password Protection)
1. Go to **Zero Trust** -> **Access** -> **Applications**.
2. Click **Add an Application** -> **Self-hosted**.
3. Application Name: `UniShare Access`.
4. Domain: `unishare.dpdns.org`.
5. **Policy**:
   - Action: **Allow**.
   - Assign a name (e.g., "Main Users").
   - **Selector**: Select "Emails" and add your email addresses, OR select "Everyone" and configure an "Identity Provider" (like Google or a Static PIN).
   - Recommended: Use "One-time PIN" which sends a code to the user's email to log in.

## 4. Database Initialization
Once deployed, Cloudflare Pages will automatically run `npx prisma generate`. Your Neon database will be ready to use immediately.

