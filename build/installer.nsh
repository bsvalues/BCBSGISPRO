; TerraFusion NSIS Installer Script
; Enterprise-level Windows installer customization

!include "MUI2.nsh"
!include "FileFunc.nsh"

; Custom pages and functions
Function .onInit
  ; Check for existing installation
  ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TerraFusion" "UninstallString"
  StrCmp $R0 "" done
  
  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
    "TerraFusion is already installed. $\n$\nClick 'OK' to remove the previous version or 'Cancel' to cancel this upgrade." \
    /SD IDOK IDOK uninst
  Abort
  
  uninst:
    ClearErrors
    ExecWait '$R0 _?=$INSTDIR'
    IfErrors no_remove_label done
    no_remove_label:
      MessageBox MB_OK|MB_ICONEXCLAMATION "Failed to uninstall previous version."
      Abort
  done:
FunctionEnd

Function .onInstSuccess
  ; Start TerraFusion service after installation
  ExecWait 'sc start "TerraFusion"'
  
  ; Create firewall rules
  ExecWait 'netsh advfirewall firewall add rule name="TerraFusion HTTP" dir=in action=allow protocol=TCP localport=5000'
  
  ; Display success message
  MessageBox MB_OK "TerraFusion Civil Infrastructure has been successfully installed!$\n$\nThe service is now running and will start automatically with Windows.$\n$\nAccess the application at: http://localhost:5000"
FunctionEnd

Function un.onInit
  MessageBox MB_OKCANCEL "Are you sure you want to completely remove TerraFusion Civil Infrastructure and all of its components?" IDOK next
    Abort
  next:
FunctionEnd

Function un.onUninstSuccess
  ; Stop and remove service
  ExecWait 'sc stop "TerraFusion"'
  ExecWait 'sc delete "TerraFusion"'
  
  ; Remove firewall rules
  ExecWait 'netsh advfirewall firewall delete rule name="TerraFusion HTTP"'
  
  MessageBox MB_OK "TerraFusion Civil Infrastructure has been successfully removed from your computer."
FunctionEnd

; Custom installation directory page
!define MUI_DIRECTORYPAGE_TEXT_TOP "Choose the folder in which to install TerraFusion Civil Infrastructure.$\n$\nRecommended: Use the default location for enterprise installations."

; Custom finish page
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Launch TerraFusion Civil Infrastructure"
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchTerraFusion"

Function LaunchTerraFusion
  ExecShell "open" "http://localhost:5000"
FunctionEnd