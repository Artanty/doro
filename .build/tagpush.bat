@echo off
setlocal EnableDelayedExpansion

:: Get the latest tag in the format v1.0.40
for /f "delims=" %%i in ('git describe --tags --abbrev^=0') do set LATEST_TAG=%%i

:: Check if there are any tags
if "%LATEST_TAG%"=="" (
    echo No tags found.
    exit /b
)

:: Extract the version number from the latest tag
set VERSION_NUMBER=%LATEST_TAG:~1%

:: Display the extracted version number
echo Latest version: %VERSION_NUMBER%

:: Increment the last digit of the version number
for /f "tokens=1,2,3 delims=." %%a in ("%VERSION_NUMBER%") do (
    set /a NEW_PATCH=%%c+1
    set NEW_VERSION=%%a.%%b.!NEW_PATCH!
)

:: Get the commit messages between the latest tag and the previous one
for /f "delims=" %%i in ('git log --pretty^=format:"%%s" !LATEST_TAG!..HEAD') do (
    set "COMMIT_MESSAGES=%%i"
)

:: Display the new version and commit messages
echo New version: !NEW_VERSION!
echo Commit messages: !COMMIT_MESSAGES!

:: Create an annotated tag with the new version and commit messages, including web & back version
git tag -a "v!NEW_VERSION!" -m "App version: !NEW_VERSION!" -m "Changes: !COMMIT_MESSAGES!"

:: Push the new tag to the remote repository
git push origin "v!NEW_VERSION!"

endlocal