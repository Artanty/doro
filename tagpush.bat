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

:: Change to the 'back' directory
cd back

:: Increment the patch version and save the new value in a variable
for /f "delims=" %%i in ('npm version patch --no-git-tag-version') do (
    set NEW_VERSION=%%i
)

:: Remove the 'v' prefix from the version
set TAG_VERSION=%NEW_VERSION:~1%

:: Commit the changes to the master branch
git add .
git commit -m "Bump version to %TAG_VERSION%"
git push origin master

:: Create an annotated tag with the new version
git tag -a "v%TAG_VERSION%" -m "Version %TAG_VERSION%"

:: Push the new tag to the remote repository
git push origin "v%TAG_VERSION%"

endlocal