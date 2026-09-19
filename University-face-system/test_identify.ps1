$path = "C:\Users\TRANTIENANH\.gemini\antigravity-ide\brain\96e4716a-70bf-4156-8f4d-765996c343e5\sample_face_1789378620496.png"
$b = [Convert]::ToBase64String([IO.File]::ReadAllBytes($path))
$body = @{image_base64=$b} | ConvertTo-Json -Compress
Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/v1/identify -ContentType 'application/json' -Body $body
