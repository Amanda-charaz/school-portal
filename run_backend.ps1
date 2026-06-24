
# Run backend server and log all output
cd backend
Write-Host "Starting backend server..."
$process = Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow -PassThru -RedirectStandardOutput "..\backend_stdout.log" -RedirectStandardError "..\backend_stderr.log"
Start-Sleep -Seconds 15
Write-Host "Server started! PID: $($process.Id)"
Get-Content "..\backend_stdout.log"
Get-Content "..\backend_stderr.log"
