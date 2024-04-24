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



@REM @echo off

@REM :: Change to the web directory
@REM cd .build\web\

@REM :: Call the first script
@REM echo Running deploy script...
@REM call set-current-version2env.bat

@REM @REM :: Call the second script
@REM @REM echo Running deploy2 script...
@REM @REM call tagpush2.bat

@REM :: Return to the original directory
@REM cd ..\..\

@REM echo All scripts have been executed.