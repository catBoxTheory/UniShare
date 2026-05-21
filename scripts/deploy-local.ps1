# UniShare Local Deployment Script (Production Mode)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  UniShare Local Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if Docker is running (for DB and Storage)
Write-Host "[1/7] Checking Infrastructure..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
docker-compose up -d
Write-Host "✓ Infrastructure (DB, MinIO) is running" -ForegroundColor Green
Write-Host ""

# 2. Set environment variables
Write-Host "[2/7] Setting environment variables..." -ForegroundColor Yellow
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/unistream?schema=public"
$env:AUTH_SECRET="complex_password_at_least_32_characters_long"
$env:MINIO_ENDPOINT="http://localhost:9000"
$env:MINIO_ACCESS_KEY="minioadmin"
$env:MINIO_SECRET_KEY="minioadmin"
$env:MINIO_BUCKET_NAME="unistream-bucket"
# Trust all hosts for NextAuth to allow LAN/WAN access via IP
$env:AUTH_TRUST_HOST="true"
$env:AUTH_URL="http://localhost:3000" 
Write-Host "✓ Environment variables set" -ForegroundColor Green
Write-Host ""

# 3. Prepare Database
Write-Host "[3/7] Preparing Database..." -ForegroundColor Yellow
npx prisma generate
npx prisma migrate deploy
Write-Host "✓ Database schema is up to date" -ForegroundColor Green
Write-Host ""

# 4. Build Application
Write-Host "[4/7] Building Application (this may take a while)..." -ForegroundColor Yellow
npx next build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green
Write-Host ""

# 5. Start Production Server
Write-Host "[5/7] Starting Production Server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Deployment Ready!" -ForegroundColor Cyan
Write-Host "  Access URL: http://localhost:3000" -ForegroundColor White

# Find and print LAN IPs
try {
    $ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback|vEthernet" -and $_.IPAddress -notmatch "^169\.254" } | Select-Object -ExpandProperty IPAddress
    if ($ips) {
        Write-Host "  Network Access (LAN):" -ForegroundColor Cyan
        foreach ($ip in $ips) {
            Write-Host "  - http://$($ip):3000" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  (Could not detect LAN IP, check ipconfig)" -ForegroundColor Gray
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Start on port 3000, listening on all interfaces (0.0.0.0)
npx next start -p 3000 -H 0.0.0.0

