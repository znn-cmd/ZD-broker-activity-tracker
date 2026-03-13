@echo off
cd /d C:\Users\ZNN\Desktop\ZD-DailyReport\broker-activity-tracker
rem Запускаем PowerShell и НЕ закрываем окно после выполнения, чтобы видеть логи
powershell -NoExit -ExecutionPolicy Bypass -File ".\report-check-fetch-amo.ps1"

