# Start Digital Legacy Backend connected to Aiven Cloud MySQL
# Safe for GitHub: Reads credentials from environment variables or .env file

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " STARTING DIGITAL LEGACY BACKEND (AIVEN CLOUD MYSQL)     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Load .env file if present in current directory or parent directory
$envFile = if (Test-Path ".env") { ".env" } elseif (Test-Path "..\.env") { "..\.env" } else { $null }
if ($envFile) {
    Write-Host "[INFO] Loading configuration from $envFile" -ForegroundColor DarkGray
    Get-Content $envFile | Where-Object { $_ -match '^\s*([^#=]+)=(.*)$' } | ForEach-Object {
        $key = $matches[1].Trim()
        $val = $matches[2].Trim()
        if (-not [Environment]::GetEnvironmentVariable($key)) {
            [Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
}

# Resolve connection parameters with secure defaults
$dbHost = if ($env:DATABASE_HOST) { $env:DATABASE_HOST } else { "mysql-2e8ca8c1-mallireddy729-3d3.k.aivencloud.com" }
$dbPort = if ($env:DATABASE_PORT) { $env:DATABASE_PORT } else { "23608" }
$dbName = if ($env:DATABASE_NAME) { $env:DATABASE_NAME } else { "defaultdb" }
$dbUser = if ($env:SPRING_DATASOURCE_USERNAME) { $env:SPRING_DATASOURCE_USERNAME } elseif ($env:DATABASE_USERNAME) { $env:DATABASE_USERNAME } else { "avnadmin" }

# Retrieve password from environment variables
$dbPass = if ($env:SPRING_DATASOURCE_PASSWORD) { $env:SPRING_DATASOURCE_PASSWORD } elseif ($env:DATABASE_PASSWORD) { $env:DATABASE_PASSWORD } else { $null }

if (-not $dbPass) {
    Write-Host "[WARNING] Database password not found in environment variables or .env file." -ForegroundColor Yellow
    $securePass = Read-Host "Enter Aiven MySQL Password" -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
    $dbPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if (-not $dbPass) {
    Write-Error "Database password is required to start the application. Set SPRING_DATASOURCE_PASSWORD or create a .env file."
    exit 1
}

$env:SPRING_DATASOURCE_URL = "jdbc:mysql://${dbHost}:${dbPort}/${dbName}?sslMode=REQUIRED&serverTimezone=UTC&allowPublicKeyRetrieval=true"
$env:SPRING_DATASOURCE_USERNAME = $dbUser
$env:SPRING_DATASOURCE_PASSWORD = $dbPass
$env:SPRING_PROFILES_ACTIVE = "dev"

Write-Host "Target Host: $dbHost" -ForegroundColor Green
Write-Host "Target Port: $dbPort" -ForegroundColor Green
Write-Host "Database:    $dbName" -ForegroundColor Green
Write-Host "DB User:     $dbUser" -ForegroundColor Green
Write-Host "Credentials: [SECURELY CONFIGURED]" -ForegroundColor Green
Write-Host ""
Write-Host "Starting Spring Boot Application..." -ForegroundColor Yellow

if (Test-Path "target\digital-legacy-backend-0.0.1-SNAPSHOT.jar") {
    java -jar "target\digital-legacy-backend-0.0.1-SNAPSHOT.jar"
} elseif (Test-Path "..\digital-legacy-backend\target\digital-legacy-backend-0.0.1-SNAPSHOT.jar") {
    java -jar "..\digital-legacy-backend\target\digital-legacy-backend-0.0.1-SNAPSHOT.jar"
} else {
    Write-Host "Error: Could not locate digital-legacy-backend-0.0.1-SNAPSHOT.jar in target folder. Run 'mvn package' first." -ForegroundColor Red
}
