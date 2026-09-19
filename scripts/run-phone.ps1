# Instant phone launcher for Iraq Esports Hub
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) { $adb = "adb" }

Write-Host "Routing port 3000..." -ForegroundColor Cyan
& $adb reverse tcp:3000 tcp:3000
& $adb shell am force-stop com.eshamikh.ieh
& $adb shell monkey -p com.eshamikh.ieh -c android.intent.category.LAUNCHER 1
Write-Host "App launched on phone with live reload." -ForegroundColor Green
