@echo off
echo ==========================================================
echo  AIVEN CLOUD MYSQL DATABASE INSPECTOR (defaultdb)
echo ==========================================================

if "%DATABASE_PASSWORD%"=="" (
    if exist .env (
        for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
            if "%%A"=="DATABASE_PASSWORD" set DATABASE_PASSWORD=%%B
            if "%%A"=="SPRING_DATASOURCE_PASSWORD" if "%DATABASE_PASSWORD%"=="" set DATABASE_PASSWORD=%%B
        )
    )
)

echo Host:     mysql-2e8ca8c1-mallireddy729-3d3.k.aivencloud.com
echo Port:     23608
echo Database: defaultdb
echo User:     avnadmin
echo ==========================================================
echo.
echo Fetching all tables in defaultdb...
echo.

if "%DATABASE_PASSWORD%"=="" (
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h mysql-2e8ca8c1-mallireddy729-3d3.k.aivencloud.com -P 23608 -u avnadmin -p defaultdb -e "SHOW TABLES; SELECT '--- USERS IN DEFAULTDB ---' AS ''; SELECT id, email, role, status FROM users; SELECT '--- TABLE ROW SUMMARY ---' AS ''; SELECT 'digital_assets' AS table_name, COUNT(*) AS count FROM digital_assets UNION ALL SELECT 'beneficiaries', COUNT(*) FROM beneficiaries UNION ALL SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'user_profiles', COUNT(*) FROM user_profiles UNION ALL SELECT 'emergency_requests', COUNT(*) FROM emergency_requests UNION ALL SELECT 'asset_permissions', COUNT(*) FROM asset_permissions UNION ALL SELECT 'activity_logs', COUNT(*) FROM activity_logs;"
) else (
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h mysql-2e8ca8c1-mallireddy729-3d3.k.aivencloud.com -P 23608 -u avnadmin -p%DATABASE_PASSWORD% defaultdb -e "SHOW TABLES; SELECT '--- USERS IN DEFAULTDB ---' AS ''; SELECT id, email, role, status FROM users; SELECT '--- TABLE ROW SUMMARY ---' AS ''; SELECT 'digital_assets' AS table_name, COUNT(*) AS count FROM digital_assets UNION ALL SELECT 'beneficiaries', COUNT(*) FROM beneficiaries UNION ALL SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'user_profiles', COUNT(*) FROM user_profiles UNION ALL SELECT 'emergency_requests', COUNT(*) FROM emergency_requests UNION ALL SELECT 'asset_permissions', COUNT(*) FROM asset_permissions UNION ALL SELECT 'activity_logs', COUNT(*) FROM activity_logs;"
)
echo.
echo ==========================================================
pause
