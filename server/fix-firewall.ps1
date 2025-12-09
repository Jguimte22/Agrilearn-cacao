# Run this script as Administrator to allow MongoDB connections

Write-Host "Adding Windows Firewall rule for MongoDB..." -ForegroundColor Yellow

# Add firewall rule to allow outbound connections to MongoDB
New-NetFirewallRule -DisplayName "MongoDB Atlas Outbound" `
    -Direction Outbound `
    -Action Allow `
    -Protocol TCP `
    -RemotePort 27017 `
    -Program "C:\Program Files\nodejs\node.exe" `
    -Description "Allow Node.js to connect to MongoDB Atlas on port 27017"

Write-Host "✅ Firewall rule added!" -ForegroundColor Green
Write-Host "Now try running your server again." -ForegroundColor Cyan
