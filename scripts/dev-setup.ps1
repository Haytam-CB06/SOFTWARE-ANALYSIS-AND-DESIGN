# scripts/dev-setup.ps1
# PowerShell 5+ / 7+. One-command dev bootstrap for VS Code PowerShell.
param(
  [string]$PgSuperUser = "postgres",
  [string]$PgHost = "127.0.0.1",
  [int]   $PgPort = 5432,
  [string]$DbUser = "smartstudy",
  [string]$DbPass = "changeme",
  [string]$DbName = "smartstudy",
  [int]   $ApiPort = 8000
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

Write-Host "Repo:      $RepoRoot"
Write-Host "Backend:   $Backend"
Write-Host "Venv:      $Venv"

# --- venv + deps (no activate needed) ---
if (-not (Test-Path $VenvPy)) {
  Write-Host "Creating venv..."
  try { & py -3 -m venv $Venv } catch { & python -m venv $Venv }
}
if (-not (Test-Path $VenvPy)) { throw "Failed to create venv (no 'py' or 'python' on PATH?)" }

Write-Host "Upgrading pip & installing requirements..."
& $VenvPy -m pip install --upgrade pip
if (Test-Path $ReqFile) {
  & $VenvPy -m pip install -r $ReqFile
} else {
  Write-Warning "requirements.txt not found at $ReqFile (skipping)."
}

# --- Find psql (PATH or Program Files trees) ---
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
  Write-Warning "psql not found on PATH or under Program Files. Skipping DB bootstrap. Install PostgreSQL client tools or add them to PATH."
} else {
  Write-Host ('Using psql at: "{0}"' -f $Psql)

  # --- Ensure role & DB exist (idempotent) ---
  $sql = @"
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$DbUser') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', '$DbUser', '$DbPass');
  ELSE
    EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', '$DbUser', '$DbPass');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '$DbName') THEN
    EXECUTE format('CREATE DATABASE %I OWNER %I', '$DbName', '$DbUser');
  END IF;
END
\$\$;

GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;
"@

  Write-Host "Ensuring role/database exist (psql may prompt for password of user '$PgSuperUser')..."
  $psqlArgs = @(
    "-h", $PgHost,
    "-p", $PgPort,
    "-U", $PgSuperUser,
    "-d", "postgres",
    "-v", "ON_ERROR_STOP=1",
    "-f", "-"
  )
  $sql | & $Psql @psqlArgs
}

# --- .env (DATABASE_URL) ---
$connection = "DATABASE_URL=postgresql+psycopg://$DbUser`:$DbPass@$PgHost`:$PgPort/$DbName"
if (-not (Test-Path $EnvFile) -and (Test-Path (Join-Path $Backend ".env.example"))) {
  Copy-Item (Join-Path $Backend ".env.example") $EnvFile
}
if (Test-Path $EnvFile) {
  $lines = Get-Content $EnvFile -ErrorAction SilentlyContinue
  $replaced = $false
  $newLines = foreach ($line in $lines) {
    if ($line -match '^\s*DATABASE_URL=') { $replaced = $true; $connection } else { $line }
  }
  if (-not $replaced) { $newLines += $connection }
  $newLines | Set-Content -Path $EnvFile -Encoding UTF8
  Write-Host "Wrote DATABASE_URL to $EnvFile"
} else {
  $connection | Set-Content -Path $EnvFile -Encoding UTF8
  Write-Host "Created $EnvFile with DATABASE_URL"
}

# --- Alembic (run inside backend) ---
Push-Location $Backend
try {
  Write-Host "Running alembic upgrade head..."
  & $VenvPy -m alembic upgrade head

  # --- Start API from inside backend so `app` is importable ---
  Write-Host "Starting API on http://127.0.0.1:$ApiPort (Ctrl+C to stop)"
  & $VenvPy -m uvicorn app.main:app --host 127.0.0.1 --port $ApiPort --reload --reload-dir "$Backend"
}
finally {
  Pop-Location
}
