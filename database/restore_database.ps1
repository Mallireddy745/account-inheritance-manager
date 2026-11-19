# Digital Legacy Manager - Database & Encrypted Vault Restore Procedure
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFolderPath,
    [string]$DbName = "digital_legacy_manager",
    [string]$DbUser = "root",
    [string]$DbPassword = $env:DB_PASSWORD
)

$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "DIGITAL LEGACY MANAGER - RESTORE PROCEDURE" -ForegroundColor Cyan
Write-Host "Source: $BackupFolderPath" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

if (!(Test-Path $BackupFolderPath)) {
    Write-Error "Backup folder does not exist: $BackupFolderPath"
}

# 1. Restore MySQL Database Dump
$DumpFile = Join-Path $BackupFolderPath "${DbName}_dump.sql"
if (Test-Path $DumpFile) {
    Write-Host "[1/2] Restoring MySQL database dump..." -ForegroundColor Yellow
    $mysqlPath = (Get-Command mysql -ErrorAction SilentlyContinue).Source
    if (-not $mysqlPath) {
        $possiblePath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
        if (Test-Path $possiblePath) {
            $mysqlPath = $possiblePath
        }
    }

    if ($mysqlPath) {
        Get-Content $DumpFile | & $mysqlPath -u $DbUser "-p$DbPassword" $DbName
        Write-Host "      Database restored successfully." -ForegroundColor Green
    } else {
        Write-Host "      Warning: mysql.exe not found in PATH or standard location." -ForegroundColor Yellow
    }
} else {
    Write-Host "      Notice: No SQL dump file found at $DumpFile" -ForegroundColor Yellow
}

# 2. Restore Encrypted Documents Vault
$VaultSource = Join-Path $BackupFolderPath "encrypted_documents_vault"
$VaultDestination = "$PSScriptRoot\..\digital-legacy-backend\uploads\documents"

Write-Host "[2/2] Restoring encrypted documents vault..." -ForegroundColor Yellow
if (Test-Path $VaultSource) {
    if (!(Test-Path $VaultDestination)) {
        New-Item -ItemType Directory -Path $VaultDestination -Force | Out-Null
    }
    Copy-Item -Path "$VaultSource\*" -Destination $VaultDestination -Recurse -Force
    Write-Host "      Vault documents restored to: $VaultDestination" -ForegroundColor Green
} else {
    Write-Host "      Notice: No encrypted vault directory found in backup." -ForegroundColor Yellow
}

Write-Host "`nRestore operation complete." -ForegroundColor Cyan
