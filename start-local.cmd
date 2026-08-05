@echo off
setlocal

rem Lance l'API et l'interface dans deux consoles distinctes.
rem npm.cmd évite le blocage de npm.ps1 par la politique PowerShell.
start "Library API" cmd.exe /k "cd /d ""%~dp0backend"" && npm.cmd run dev"
start "Library Frontend" cmd.exe /k "cd /d ""%~dp0frontend"" && npm.cmd run dev"

