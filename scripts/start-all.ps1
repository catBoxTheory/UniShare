# 1. Check Docker & Start DB
Write-Host "Checking Docker status..." -ForegroundColor Yellow
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker is not running." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host "Ensuring database services are running..." -ForegroundColor Yellow
docker-compose up -d postgres minio
Start-Sleep -Seconds 5 # Wait for DB to be ready

$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/unistream"
Write-Host "Syncing database schema..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss

# 2. Start Cloudflared in background
Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Yellow

# Kill existing cloudflared processes
Stop-Process -Name "cloudflared" -ErrorAction SilentlyContinue
Stop-Process -Name "node" -ErrorAction SilentlyContinue
Remove-Item "tunnel.log" -ErrorAction SilentlyContinue

# Start new tunnel process
$tunnelProcess = Start-Process -FilePath ".\cloudflared.exe" -ArgumentList "tunnel", "--url", "http://localhost:3000", "--logfile", "tunnel.log" -PassThru

# 3. Wait for URL
Write-Host "Waiting for tunnel URL..." -ForegroundColor Yellow
$url = $null
for ($i = 0; $i -lt 30; $i++) {
    if (Test-Path "tunnel.log") {
        # Read file with shared access to avoid locking issues
        $log = Get-Content "tunnel.log" -ErrorAction SilentlyContinue
        
        if ($log) {
            foreach ($line in $log) {
                if ($line -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
                    $url = $matches[0]
                    break
                }
            }
        }
        if ($url) { break }
    }
    Start-Sleep -Seconds 1
}

if (-not $url) {
    Write-Error "Could not get tunnel URL. Please check tunnel.log manually."
    Get-Content "tunnel.log" -ErrorAction SilentlyContinue | Select-Object -Last 10
    Stop-Process -Id $tunnelProcess.Id
    exit
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Public URL: $url" -ForegroundColor Cyan
Write-Host "  (Please update Google Cloud Console with this URL)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green

# 4. Update .env
$envFile = ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $newContent = $content -replace "NEXTAUTH_URL=.*", "NEXTAUTH_URL=$url"
    
    # If key doesn't exist, append it
    if ($content -notmatch "NEXTAUTH_URL=") {
        $newContent += "NEXTAUTH_URL=$url"
    }
    
    $newContent | Set-Content $envFile
    Write-Host "Updated .env NEXTAUTH_URL" -ForegroundColor Green
}

# 5. Set Env Vars & Start Next.js
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/unistream"
$env:AUTH_SECRET = "your-super-secret-key-change-this-in-production-123456"
$env:NEXTAUTH_URL = $url
$env:AUTH_TRUST_HOST = "true"

Read-Host "Press Enter to start Next.js (Make sure you copied the URL above!)"

Write-Host "Starting Next.js..." -ForegroundColor Yellow
npm run dev

# Cleanup when Next.js stops
Stop-Process -Id $tunnelProcess.Id -ErrorAction SilentlyContinue
