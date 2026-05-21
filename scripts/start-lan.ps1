# 获取本机局域网 IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -match "Wi-Fi|Ethernet" } | Select-Object -First 1).IPAddress

Write-Host "========================================" -ForegroundColor Green
Write-Host "  UniShare LAN Launcher (Auto-Config)" -ForegroundColor Green
Write-Host "  Local IP: $ip" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green

# 1. 动态更新 .env 文件中的 NEXTAUTH_URL
$envFile = ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $newContent = $content -replace "NEXTAUTH_URL=.*", "NEXTAUTH_URL=http://$ip`:3000"
    
    # 如果没找到 NEXTAUTH_URL，追加一行
    if ($content -notcontains "NEXTAUTH_URL=http://$ip`:3000" -and $newContent -notmatch "NEXTAUTH_URL=") {
        $newContent += "NEXTAUTH_URL=http://$ip`:3000"
    }
    
    $newContent | Set-Content $envFile
    Write-Host "Updated .env NEXTAUTH_URL to http://$ip`:3000" -ForegroundColor Cyan
}

# 2. 设置当前会话环境变量 (双重保险)
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/unistream"
$env:AUTH_SECRET = "your-super-secret-key-change-this-in-production-123456"
$env:NEXTAUTH_URL = "http://$ip`:3000"
$env:AUTH_TRUST_HOST = "true"

# 3. 启动服务器
Write-Host "Starting server on http://$ip`:3000 ..." -ForegroundColor Cyan
npm run dev -- -H 0.0.0.0
