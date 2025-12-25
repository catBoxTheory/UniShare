# UniShare Deployment Guide

## Prerequisites

- Node.js 18+
- Docker Desktop
- npm or pnpm

## Quick Start (Local Production)

To deploy the website on your current PC so users can access it:

1.  Ensure Docker Desktop is running.
2.  Open PowerShell in the project root.
3.  Run the deployment script:
    ```powershell
    ./scripts/deploy-local.ps1
    ```
4.  The script will:
    -   Start the database and storage (Docker).
    -   Build the application.
    -   Start the web server on port 3000.

**Access:**
-   **Local:** http://localhost:3000
-   **Network:** http://<YOUR_PC_IP>:3000 (Ensure your firewall allows node.js connections)

## Development Mode

To run in development mode (hot-reloading):

1.  Start infrastructure services:
    ```bash
    docker-compose up -d
    ```
2.  Run startup script:
    ```bash
    ./scripts/start-dev.ps1
    ```
    (Runs on port 3001)

## Services

| Service | URL | Credentials |
| :--- | :--- | :--- |
| **Web App** | http://localhost:3000 | (Register a new user) |
| **MinIO Console** | http://localhost:9001 | `minioadmin` / `minioadmin` |
| **PgAdmin** | http://localhost:5050 | `admin@unishare.com` / `password` |
