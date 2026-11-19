@echo off
echo ==========================================================
echo  CONNECTING TO AIVEN CLOUD MYSQL TERMINAL
echo ==========================================================

if "%DATABASE_PASSWORD%"=="" (
    if exist .env (
        for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
            if "%%A"=="DATABASE_PASSWORD" set DATABASE_PASSWORD=%%B
            if "%%A"=="SPRING_DATASOURCE_PASSWORD" if "%DATABASE_PASSWORD%"=="" set DATABASE_PASSWORD=%%B
        )
    )
)

if "%DATABASE_PASSWORD%"=="" (
    echo [INFO] Please enter Aiven MySQL Password when prompted:
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h mysql-2e8ca8c1-mallireddy729-3d3.k.aivencloud.com -P 23608 -u avnadmin -p defaultdb
) else (
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h mysql-2e8ca8c1-mallireddy729-3d3.k.aivencloud.com -P 23608 -u avnadmin -p%DATABASE_PASSWORD% defaultdb
)
pause
