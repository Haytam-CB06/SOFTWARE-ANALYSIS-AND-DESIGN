# scripts/dev-setup.ps1
# PowerShell 5+ / 7+
# Bootstraps PostgreSQL + Alembic, then starts the whole backend.

param(
  [string]$PgSuperUser = "postgres",
  [string]$PgHost = "127.0.0.1",
  [int]   $PgPort = 5432,
  [string]$DbUser = "smartstudy",
  [string]$DbPass = "changeme",
  [string]$DbName = "smartstudy",
  [switch]$RestartExisting
)

$ErrorActionPreference = "Stop"

# --- Paths ---
$ScriptDir = Split-Path -Parent $PSCommandPath
$RepoRoot  = Resolve-Path (Join-Path $ScriptDir "..")
$Backend   = Join-Path $RepoRoot "backend"
$Venv      = Join-Path $RepoRoot "venv"
$VenvPy    = Join-Path $Venv "Scripts\python.exe"
$EnvFile   = Join-Path $Backend ".env"
$ReqFile   = Join-Path $RepoRoot "requirements.txt"

Write-Host "Repo:    $RepoRoot"
Write-Host "Backend: $Backend"
Write-Host "Venv:    $Venv"

# --- Services to run ---
$Services = @(
  @{ Name = "gateway";         Port = 8000; Target = "app.gateway.app:app";                         Reload = $true  },
  @{ Name = "planning";        Port = 8001; Target = "app.microservices.planner.app:app";           Reload = $false },
  @{ Name = "workspace";       Port = 8002; Target = "app.microservices.workspaces.app:app";        Reload = $false },
  @{ Name = "collaboration";   Port = 8003; Target = "app.microservices.collaboration.app:app";     Reload = $false },
  @{ Name = "notification";    Port = 8004; Target = "app.microservices.notifications.app:app";     Reload = $false },
  @{ Name = "task-assessment"; Port = 8005; Target = "app.microservices.task_assessment.app:app";   Reload = $false },
  @{ Name = "auth";            Port = 8009; Target = "app.microservices.auth.app:app";              Reload = $false }
)

# --- venv + deps ---
if (-not (Test-Path $VenvPy)) {
  Write-Host "Creating venv..."
  try { & py -3 -m venv $Venv } catch { & python -m venv $Venv }
}
if (-not (Test-Path $VenvPy)) {
  throw "Failed to create venv (no 'py' or 'python' on PATH?)"
}

Write-Host "Upgrading pip & installing requirements..."
& $VenvPy -m pip install --upgrade pip
if (Test-Path $ReqFile) {
  & $VenvPy -m pip install -r $ReqFile
} else {
  Write-Warning "requirements.txt not found at $ReqFile (skipping)."
}

# --- Find psql ---
function Find-Psql {
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $roots = @(
    $env:ProgramFiles,
    "${env:ProgramFiles}\PostgreSQL",
    "${env:ProgramFiles(x86)}",
    "${env:ProgramFiles(x86)}\PostgreSQL",
    "C:\Program Files",
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)",
    "C:\Program Files (x86)\PostgreSQL"
  ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

  $candidates = foreach ($r in $roots) {
    Get-ChildItem -Path $r -Recurse -Filter psql.exe -ErrorAction SilentlyContinue
  }

  if ($candidates) {
    return ($candidates | Sort-Object FullName -Descending | Select-Object -First 1).FullName
  }
  return $null
}

$Psql = Find-Psql
if (-not $Psql) {
  Write-Warning "psql not found on PATH or under Program Files."
  Write-Warning "Install PostgreSQL client tools or add them to PATH."
  throw "PostgreSQL bootstrap cannot continue without psql."
}

Write-Host ('Using psql at: "{0}"' -f $Psql)

# --- Ensure role exists ---
Write-Host "Ensuring PostgreSQL role exists..."
$roleExists = & $Psql `
  -h $PgHost `
  -p $PgPort `
  -U $PgSuperUser `
  -d postgres `
  -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DbUser';"

if (-not ($roleExists -and $roleExists.Trim() -eq "1")) {
  Write-Host "Creating role '$DbUser'..."
  & $Psql `
    -h $PgHost `
    -p $PgPort `
    -U $PgSuperUser `
    -d postgres `
    -v ON_ERROR_STOP=1 `
    -c "CREATE ROLE `"$DbUser`" LOGIN PASSWORD '$DbPass';"
} else {
  Write-Host "Updating password for role '$DbUser'..."
  & $Psql `
    -h $PgHost `
    -p $PgPort `
    -U $PgSuperUser `
    -d postgres `
    -v ON_ERROR_STOP=1 `
    -c "ALTER ROLE `"$DbUser`" WITH LOGIN PASSWORD '$DbPass';"
}

# --- Ensure database exists ---
$dbExists = & $Psql `
  -h $PgHost `
  -p $PgPort `
  -U $PgSuperUser `
  -d postgres `
  -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName';"

if (-not ($dbExists -and $dbExists.Trim() -eq "1")) {
  Write-Host "Creating database '$DbName'..."
  & $Psql `
    -h $PgHost `
    -p $PgPort `
    -U $PgSuperUser `
    -d postgres `
    -v ON_ERROR_STOP=1 `
    -c "CREATE DATABASE `"$DbName`" OWNER `"$DbUser`";"
} else {
  Write-Host "Database '$DbName' already exists."
}

Write-Host "Granting privileges on database '$DbName'..."
& $Psql `
  -h $PgHost `
  -p $PgPort `
  -U $PgSuperUser `
  -d postgres `
  -v ON_ERROR_STOP=1 `
  -c "GRANT ALL PRIVILEGES ON DATABASE `"$DbName`" TO `"$DbUser`";"

# --- .env ---
$connection = "DATABASE_URL=postgresql+psycopg://$DbUser`:$DbPass@$PgHost`:$PgPort/$DbName"

if (-not (Test-Path $EnvFile) -and (Test-Path (Join-Path $Backend ".env.example"))) {
  Copy-Item (Join-Path $Backend ".env.example") $EnvFile
}

if (Test-Path $EnvFile) {
  $lines = Get-Content $EnvFile -ErrorAction SilentlyContinue
  $replaced = $false
  $newLines = foreach ($line in $lines) {
    if ($line -match '^\s*DATABASE_URL=') {
      $replaced = $true
      $connection
    } else {
      $line
    }
  }
  if (-not $replaced) { $newLines += $connection }
  $newLines | Set-Content -Path $EnvFile -Encoding UTF8
  Write-Host "Wrote DATABASE_URL to $EnvFile"
} else {
  $connection | Set-Content -Path $EnvFile -Encoding UTF8
  Write-Host "Created $EnvFile with DATABASE_URL"
}

# --- Alembic ---
Push-Location $Backend
try {
  Write-Host "Running alembic upgrade head..."
  & $VenvPy -m alembic upgrade head
}
finally {
  Pop-Location
}

# --- Start service window ---
function Get-PortListener {
  param([int]$Port)

  try {
    return Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -First 1
  } catch {
    return $null
  }
}

function Stop-PortListener {
  param(
    [string]$Name,
    [int]$Port
  )

  $listener = Get-PortListener -Port $Port
  if (-not $listener) { return $true }

  $processId = $listener.OwningProcess
  if (-not $processId) {
    Write-Warning "Port $Port is in use, but the owning process could not be identified. Skipping $Name."
    return $false
  }

  try {
    $process = Get-Process -Id $processId -ErrorAction Stop
    Write-Host ("Stopping existing {0} listener on port {1} (PID {2}, {3})..." -f $Name, $Port, $processId, $process.ProcessName)
    Stop-Process -Id $processId -Force -ErrorAction Stop
    Start-Sleep -Milliseconds 500
  } catch {
    Write-Warning ("Could not stop process {0} on port {1}: {2}" -f $processId, $Port, $_.Exception.Message)
    return $false
  }

  return -not (Get-PortListener -Port $Port)
}

function Start-ServiceWindow {
  param(
    [string]$Name,
    [int]$Port,
    [string]$Target,
    [bool]$Reload
  )

  $listener = Get-PortListener -Port $Port
  if ($listener) {
    if ($RestartExisting) {
      if (-not (Stop-PortListener -Name $Name -Port $Port)) {
        Write-Warning "Skipping $Name because http://127.0.0.1:$Port is still in use."
        return $false
      }
    } else {
      Write-Warning ("Skipping {0}: http://127.0.0.1:{1} is already in use by PID {2}. Use -RestartExisting to replace it." -f $Name, $Port, $listener.OwningProcess)
      return $false
    }
  }

  $uvicornArgs = "$Target --host 127.0.0.1 --port $Port"
  if ($Reload) {
    $uvicornArgs += " --reload"
  }

  $cmd = @"
Set-Location '$Backend'
`$env:PYTHONPATH = (Get-Location).Path
`$env:AUTH_SERVICE_URL = 'http://127.0.0.1:8009'
`$env:WORKSPACE_SERVICE_URL = 'http://127.0.0.1:8002'
`$env:PLANNING_SERVICE_URL = 'http://127.0.0.1:8001'
`$env:TASK_ASSESSMENT_SERVICE_URL = 'http://127.0.0.1:8005'
`$env:COLLABORATION_SERVICE_URL = 'http://127.0.0.1:8003'
`$env:NOTIFICATION_SERVICE_URL = 'http://127.0.0.1:8004'
`$env:BFF_TIMEOUT_SECONDS = '1.5'
`$env:DASHBOARD_CACHE_TTL_SECONDS = '60'
`$env:GATEWAY_TIMEOUT_SECONDS = '15'
`$env:PERF_BUDGET_SIMPLE_READ_MS = '200'
`$env:PERF_BUDGET_NORMAL_API_MS = '500'
`$env:PERF_BUDGET_HEAVY_ACK_MS = '250'
`$env:ENABLE_NOTIFICATION_POLLER = 'false'
Write-Host 'Starting $Name on http://127.0.0.1:$Port'
& '$VenvPy' -m uvicorn $uvicornArgs
"@

  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    $cmd
  ) | Out-Null

  Write-Host ("Started {0} on http://127.0.0.1:{1}" -f $Name, $Port)
  return $true
}

# --- Launch all services ---
Write-Host ""
Write-Host "Starting whole backend..."
$startedServices = @()
$skippedServices = @()
foreach ($svc in $Services) {
  $started = Start-ServiceWindow -Name $svc.Name -Port $svc.Port -Target $svc.Target -Reload $svc.Reload
  if ($started) {
    $startedServices += $svc
  } else {
    $skippedServices += $svc
  }
}

Write-Host ""
Write-Host "Backend apps:"
foreach ($svc in $startedServices) {
  Write-Host ("  - started {0}: http://127.0.0.1:{1}" -f $svc.Name, $svc.Port)
}
foreach ($svc in $skippedServices) {
  Write-Host ("  - already running/skipped {0}: http://127.0.0.1:{1}" -f $svc.Name, $svc.Port)
}
if ($skippedServices.Count -eq 0) {
  Write-Host ""
  Write-Host "All backend apps started:"
}
foreach ($svc in $Services) {
  Write-Host ("  - {0}: http://127.0.0.1:{1}" -f $svc.Name, $svc.Port)
}
