$path = "C:\Users\TRANTIENANH\.gemini\antigravity-ide\brain\96e4716a-70bf-4156-8f4d-765996c343e5\sample_face_1789378620496.png"
$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($path))
$payload = @{image_base64=$base64} | ConvertTo-Json -Compress
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/attendance/auto-verify -ContentType 'application/json' -Body $payload
