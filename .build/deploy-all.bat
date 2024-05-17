@echo off
setlocal

:: Temporarily change to the build directory
cd .build

:: Run the batch script in the build directory
call tagpush.bat

:: Run the batch script in the web directory
call ver2env.bat

:: Return to the original directory
cd ..\..\

endlocal
