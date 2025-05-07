@echo off
echo Building distribution package...

REM Create dist directory
if not exist dist mkdir dist

REM Create Docker package
echo Creating Docker package...
if not exist dist\docker mkdir dist\docker
xcopy /E /I /Y server dist\docker\server
copy Dockerfile dist\docker\
copy docker-compose.yml dist\docker\
copy run_docker.bat dist\docker\
copy run_docker.sh dist\docker\
copy README.md dist\docker\

REM Create Windows package
echo Creating Windows package...
if not exist dist\windows mkdir dist\windows
xcopy /E /I /Y windows_build\* dist\windows\
xcopy /E /I /Y server dist\windows\server
copy README.md dist\windows\

REM Create HTML user guide (can be converted to PDF)
echo Copying documentation...
copy ICSF_Admin_Dashboard_Guide.html dist\

REM Create a zip archive (requires PowerShell)
echo Creating zip archive...
powershell -Command "Compress-Archive -Path 'dist\docker', 'dist\windows', 'dist\ICSF_Admin_Dashboard_Guide.html' -DestinationPath 'dist\BentonGeoPro_Sync_Dashboard.zip' -Force"

echo Distribution package ready!
echo You can find it at: dist\BentonGeoPro_Sync_Dashboard.zip
pause