param(
 [Parameter(Mandatory=$true)][string]$PublicApiOrigin,
 [Parameter(Mandatory=$true)][string]$SqlUser,
 [string[]]$AdditionalOrigins=@('https://abencoada-agricola.github.io','https://localhost')
)
$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
$origin=[Uri]$PublicApiOrigin
if($origin.Scheme -ne 'https' -or $origin.IsLoopback -or $origin.AbsolutePath -ne '/' -or $origin.Query -or $origin.Fragment){throw 'Informe a origem HTTPS real, sem caminho.'}
New-Item -ItemType Directory -Force -Path sqlserver | Out-Null
$password=Read-Host 'Senha SQL (não será exibida)' -AsSecureString
$credential=New-Object System.Management.Automation.PSCredential($SqlUser,$password)
$credential | Export-Clixml -LiteralPath 'sqlserver/credentials.local.xml'
$settings=@{server='177.234.159.74';database='APP_ABENCOADA';credentialPath='sqlserver/credentials.local.xml';trustServerCertificate=$true}
$json=$settings|ConvertTo-Json
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'sqlserver/connection.local.json'),$json,(New-Object Text.UTF8Encoding($false)))
$origins=@($origin.GetLeftPart([UriPartial]::Authority))+$AdditionalOrigins
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'allowed-origins.local.txt'),($origins -join ','),(New-Object Text.UTF8Encoding($false)))
Write-Output 'Configuração salva. Execute o serviço com esta mesma conta Windows, após instalar as dependências.'
