# Instant Desktop Launcher for Iraq Esports Hub
Write-Host "Launching Iraq Esports Hub Desktop..." -ForegroundColor Cyan

$tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -WarningAction SilentlyContinue
if (-not $tcp.TcpTestSucceeded) {
    Write-Host "Dev server not detected on port 3000. Launching with npm run electron:dev..." -ForegroundColor Yellow
    npm run electron:dev
} else {
    Write-Host "Dev server detected on port 3000. Launching Electron window..." -ForegroundColor Green
    npx electron .
}
