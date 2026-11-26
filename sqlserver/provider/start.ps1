$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:SQL_API_HOST='127.0.0.1'
$env:PORT='4780'
$env:SQL_ALLOWED_ORIGINS=(Get-Content -Raw -LiteralPath 'allowed-origins.local.txt').Trim()
node sqlserver/server.mjs
exit $LASTEXITCODE
