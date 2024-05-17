@echo off
setlocal

:: Check for uncommitted changes
git diff-index --quiet HEAD -- || (
    echo There are uncommitted changes. Commit or stash them before running this script.
    exit /b
)

:: Check for unpushed commits
for /f "delims=" %%i in ('git diff origin/master..HEAD') do (
    echo There are unpushed commits. Push them before running this script.
    exit /b
)

:: Get the current version from package.json
for /f "delims=" %%i in ('node -p "require('../package.json').version"') do set CURRENT_VERSION=%%i

:: Check if the current version has a tag
git rev-parse v%CURRENT_VERSION% > nul 2>&1 || (
    echo There is no tag for the current version v%CURRENT_VERSION%. Create a tag for the current version before running this script.
    exit /b
)

:: Increment the patch version and save the new value in a variable
for /f "delims=" %%i in ('npm version patch --no-git-tag-version') do (
    set NEW_VERSION=%%i
)

:: Remove the 'v' prefix from the version
set TAG_VERSION=%NEW_VERSION:~1%

:: Wait for 3 seconds
timeout /t 3 /nobreak > nul

:: Commit the changes to the master branch
git add .
git commit -m "* build: DORO-0001 %TAG_VERSION%;"
git push origin master

:: Get the commit messages since the last tag
for /f "delims=" %%i in ('git log --pretty^=format:"%%s" HEAD...v%CURRENT_VERSION%') do (
    set COMMIT_MESSAGES=%%i
)

:: Create an annotated tag with the new version and commit messages, including web & back version
git tag -a "v%TAG_VERSION%" -m "App version: %TAG_VERSION%" -m "Changes: %COMMIT_MESSAGES%"

:: Push the new tag to the remote repository
git push origin "v%TAG_VERSION%"


endlocal