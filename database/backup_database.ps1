# Digital Legacy Manager - Database & Encrypted Vault Backup Automation Script
param (
    [string]$DbName = "digital_legacy_manager",
    [string]$DbUser = "root",
    [string]$DbPassword = $env:DB_PASSWORD,
    [string]$BackupDir = "$PSScriptRoot\backups"
)

$ErrorActionPreference = "Stop"

$Timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$TargetBackupFolder = "$BackupDir\backup_$Timestamp"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "DIGITAL LEGACY MANAGER - AUTOMATED BACKUP PROCEDURE" -ForegroundColor Cyan
Write-Host "Timestamp: $Timestamp" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Create target backup folder
if (!(Test-Path -Path $TargetBackupFolder)) {
    New-Item -ItemType Directory -Path $TargetBackupFolder -Force | Out-Null
    Write-Host "[1/3] Created backup directory: $TargetBackupFolder" -ForegroundColor Green
}

# 2. Export MySQL Database Dump
$DumpFile = "$TargetBackupFolder\${DbName}_dump.sql"
Write-Host "[2/3] Exporting MySQL database dump..." -ForegroundColor Yellow

$mysqldumpPath = (Get-Command mysqldump -ErrorAction SilentlyContinue).Source
if (-not $mysqldumpPath) {
    # Check default MySQL 8.0 installation path on Windows
    $possiblePath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
    if (Test-Path $possiblePath) {
        $mysqldumpPath = $possiblePath
    }
}

if ($mysqldumpPath) {
    & $mysqldumpPath -u $DbUser "-p$DbPassword" --databases $DbName --single-transaction --quick --routines --triggers --result-file="$DumpFile"
    Write-Host "      Database dump successfully exported: $DumpFile" -ForegroundColor Green
} else {
    Write-Host "      Warning: mysqldump.exe not found in PATH or standard directory." -ForegroundColor Yellow
    Write-Host "      You can manually export using MySQL Workbench: Server -> Data Export." -ForegroundColor Yellow
}

# 3. Snapshot Encrypted Documents Vault
$VaultSource = "$PSScriptRoot\..\digital-legacy-backend\uploads\documents"
$VaultDestination = "$TargetBackupFolder\encrypted_documents_vault"

Write-Host "[3/3] Backing up AES-256 encrypted documents vault..." -ForegroundColor Yellow
if (Test-Path $VaultSource) {
    Copy-Item -Path $VaultSource -Destination $VaultDestination -Recurse -Force
    $fileCount = (Get-ChildItem -Path $VaultSource -File).Count
    Write-Host "      Backed up $fileCount encrypted vault files into: $VaultDestination" -ForegroundColor Green
} else {
    Write-Host "      Notice: Document upload vault directory is empty or not yet created." -ForegroundColor Gray
}

Write-Host "`nBackup completed successfully to: $TargetBackupFolder" -ForegroundColor Cyan
