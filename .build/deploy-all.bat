@echo off
setlocal

:: Temporarily change to the web directory
cd .build

:: Run the batch script in the web directory
call tagpush.bat

:: Temporarily change to the web directory
cd web\

:: Run the batch script in the web directory
call set-current-version2env.bat

:: Return to the original directory
cd ..\..\

endlocal
