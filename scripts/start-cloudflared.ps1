Write-Host "Downloading Cloudflared..."
if (-not (Test-Path "cloudflared.exe")) {
    Invoke-WebRequest -Uri https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -OutFile cloudflared.exe
}

Write-Host "Starting Tunnel..."
Write-Host "Look for a URL ending in .trycloudflare.com below:" -ForegroundColor Yellow
.\cloudflared.exe tunnel --url http://localhost:3000

