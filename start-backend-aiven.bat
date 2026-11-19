@echo off
echo ==========================================================
echo  STARTING DIGITAL LEGACY BACKEND (AIVEN CLOUD MYSQL)
echo ==========================================================

if "%SPRING_DATASOURCE_PASSWORD%"=="" (
    if exist .env (
        for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
            if "%%A"=="SPRING_DATASOURCE_PASSWORD" set SPRING_DATASOURCE_PASSWORD=%%B
            if "%%A"=="DATABASE_PASSWORD" if "%SPRING_DATASOURCE_PASSWORD%"=="" set SPRING_DATASOURCE_PASSWORD=%%B
        )
    )
)

if "%SPRING_DATASOURCE_PASSWORD%"=="" (
    echo [WARNING] SPRING_DATASOURCE_PASSWORD not set. Please enter password:
    set /p SPRING_DATASOURCE_PASSWORD=
)

set SPRING_DATASOURCE_URL=jdbc:mysql://mysql-2e8ca8c1-mallireddy729-3d3.k.aivencloud.com:23608/defaultdb?sslMode=REQUIRED^&serverTimezone=UTC^&allowPublicKeyRetrieval=true
set SPRING_DATASOURCE_USERNAME=avnadmin
set SPRING_PROFILES_ACTIVE=dev

echo Host:     mysql-2e8ca8c1-mallireddy729-3d3.k.aivencloud.com
echo Port:     23608
echo Database: defaultdb
echo SSL Mode: REQUIRED
echo Credentials: [SECURELY CONFIGURED]
echo.
echo Starting Spring Boot Application...

if exist "digital-legacy-backend\target\digital-legacy-backend-0.0.1-SNAPSHOT.jar" (
    java -jar "digital-legacy-backend\target\digital-legacy-backend-0.0.1-SNAPSHOT.jar"
) else if exist "target\digital-legacy-backend-0.0.1-SNAPSHOT.jar" (
    java -jar "target\digital-legacy-backend-0.0.1-SNAPSHOT.jar"
) else (
    echo Error: Could not locate digital-legacy-backend-0.0.1-SNAPSHOT.jar in target folder.
)
