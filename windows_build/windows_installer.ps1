# BentonGeoPro Sync Dashboard Windows Installer
# PowerShell script to install the application

# Function to check if running as administrator
function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    $currentUser.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
}

# Check if running as administrator
if (-not (Test-Admin)) {
    Write-Host "This script needs to be run as an administrator. Please restart PowerShell as an administrator." -ForegroundColor Red
    Start-Sleep -Seconds 5
    exit
}

# Configuration
$appName = "BentonGeoPro Sync Dashboard"
$installDir = "$env:PROGRAMFILES\BentonGeoPro"
$executableName = "BentonGeoProSyncDashboard.exe"
$sourceExe = (Get-Location).Path + "\$executableName"
$shortcutPath = "$env:USERPROFILE\Desktop\$appName.lnk"

# Create installation directory
Write-Host "Installing $appName..." -ForegroundColor Cyan
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir | Out-Null
    Write-Host "Created installation directory: $installDir" -ForegroundColor Green
}

# Copy executable file
if (Test-Path $sourceExe) {
    Copy-Item -Path $sourceExe -Destination "$installDir\$executableName" -Force
    Write-Host "Copied application executable to installation directory" -ForegroundColor Green
} else {
    Write-Host "Error: Could not find $executableName in the current directory!" -ForegroundColor Red
    Write-Host "Make sure you run this script from the directory containing $executableName" -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    exit
}

# Create data directories
$logDir = "$installDir\logs"
$uploadDir = "$installDir\uploads"
$staticDir = "$installDir\static"

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
    Write-Host "Created logs directory" -ForegroundColor Green
}

if (-not (Test-Path $uploadDir)) {
    New-Item -ItemType Directory -Path $uploadDir | Out-Null
    Write-Host "Created uploads directory" -ForegroundColor Green
}

if (-not (Test-Path $staticDir)) {
    New-Item -ItemType Directory -Path $staticDir | Out-Null
    Write-Host "Created static files directory" -ForegroundColor Green
}

# Create desktop shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "$installDir\$executableName"
$Shortcut.WorkingDirectory = $installDir
$Shortcut.Description = "ICSF-compliant property data synchronization system"
$Shortcut.IconLocation = "$installDir\$executableName,0"
$Shortcut.Save()
Write-Host "Created desktop shortcut" -ForegroundColor Green

# Create Start Menu shortcut
$startMenuDir = "$env:PROGRAMDATA\Microsoft\Windows\Start Menu\Programs\BentonGeoPro"
if (-not (Test-Path $startMenuDir)) {
    New-Item -ItemType Directory -Path $startMenuDir | Out-Null
}
$startMenuShortcut = "$startMenuDir\$appName.lnk"
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($startMenuShortcut)
$Shortcut.TargetPath = "$installDir\$executableName"
$Shortcut.WorkingDirectory = $installDir
$Shortcut.Description = "ICSF-compliant property data synchronization system"
$Shortcut.IconLocation = "$installDir\$executableName,0"
$Shortcut.Save()
Write-Host "Created Start Menu shortcut" -ForegroundColor Green

# Create uninstaller
$uninstallerPath = "$installDir\uninstall.ps1"
$uninstallerContent = @"
# BentonGeoPro Sync Dashboard Uninstaller

function Test-Admin {
    `$currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    `$currentUser.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
}

if (-not (Test-Admin)) {
    Write-Host "This script needs to be run as an administrator. Please restart PowerShell as an administrator." -ForegroundColor Red
    Start-Sleep -Seconds 5
    exit
}

Write-Host "Uninstalling BentonGeoPro Sync Dashboard..." -ForegroundColor Cyan

# Remove desktop shortcut
if (Test-Path "`$env:USERPROFILE\Desktop\BentonGeoPro Sync Dashboard.lnk") {
    Remove-Item -Path "`$env:USERPROFILE\Desktop\BentonGeoPro Sync Dashboard.lnk" -Force
    Write-Host "Removed desktop shortcut" -ForegroundColor Green
}

# Remove Start Menu shortcut
if (Test-Path "`$env:PROGRAMDATA\Microsoft\Windows\Start Menu\Programs\BentonGeoPro") {
    Remove-Item -Path "`$env:PROGRAMDATA\Microsoft\Windows\Start Menu\Programs\BentonGeoPro" -Recurse -Force
    Write-Host "Removed Start Menu shortcuts" -ForegroundColor Green
}

# Remove program files
if (Test-Path "$installDir") {
    Remove-Item -Path "$installDir" -Recurse -Force
    Write-Host "Removed installation directory" -ForegroundColor Green
}

Write-Host "Uninstallation complete!" -ForegroundColor Green
Start-Sleep -Seconds 2
"@

Set-Content -Path $uninstallerPath -Value $uninstallerContent
Write-Host "Created uninstaller script" -ForegroundColor Green

# Create Start Menu uninstaller shortcut
$uninstallerShortcut = "$startMenuDir\Uninstall $appName.lnk"
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($uninstallerShortcut)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$uninstallerPath`""
$Shortcut.WorkingDirectory = $installDir
$Shortcut.Description = "Uninstall BentonGeoPro Sync Dashboard"
$Shortcut.Save()

# Installation complete
Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "You can now launch $appName from your desktop or Start Menu." -ForegroundColor Cyan
Write-Host ""
Write-Host "To uninstall, use the uninstaller in the Start Menu or run:" -ForegroundColor Yellow
Write-Host "powershell.exe -ExecutionPolicy Bypass -File `"$uninstallerPath`"" -ForegroundColor Yellow
Write-Host ""

# Ask if user wants to start the application
$startApp = Read-Host "Do you want to start $appName now? (Y/N)"
if ($startApp -eq "Y" -or $startApp -eq "y") {
    Start-Process -FilePath "$installDir\$executableName"
    Write-Host "Application started. Please check your browser." -ForegroundColor Green
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")