
# Start backend and capture output
cd backend
Write-Host "Starting backend server..."
& node server.js 2>&1 | Tee-Object -FilePath backend.log
