@echo off
setlocal

:: Get the current APP version from package.json
for /f "delims=" %%i in ('node -p "require('../package.json').version"') do set CURRENT_VERSION=%%i

:: Define the path to .env file
set ENV_FILE=../.env

:: Check if the .env file exists
if not exist "%ENV_FILE%" (
    echo The .env file does not exist.
    exit /b
)

:: Initialize a flag to track if the CURRENT_VERSION variable was found
set VAR_FOUND=false

:: Read the .env file and replace the CURRENT_VERSION line
(
    for /f "tokens=1* delims==" %%a in (%ENV_FILE%) do (
        if /i "%%a"=="CURRENT_VERSION" (
            echo CURRENT_VERSION=%CURRENT_VERSION%
            set VAR_FOUND=true
        ) else (
            echo %%a=%%b
        )
    )
) > temp.env

:: If the CURRENT_VERSION variable was not found, append it to the end of the file
if "%VAR_FOUND%"=="false" (
    echo CURRENT_VERSION=%CURRENT_VERSION% >> temp.env
)

:: Move the temp file to the original .env file
move /y temp.env %ENV_FILE% > nul

endlocal