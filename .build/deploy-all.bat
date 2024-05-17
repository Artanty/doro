@echo off
setlocal

:: Temporarily change to the web directory
cd .build

:: Run the batch script in the web directory
call tagpush.bat

:: Run the batch script in the web directory
call ver2env.bat

:: Return to the original directory
cd ..\..\

endlocal
