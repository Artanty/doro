@echo off
setlocal

:: Change to the 'back' directory
cd back

:: Increment the patch version and save the new value in a variable
for /f "delims=" %%i in ('npm version patch --no-git-tag-version') do (
    set NEW_VERSION=%%i
)

:: Remove the 'v' prefix from the version
set TAG_VERSION=%NEW_VERSION:~1%

:: Create an annotated tag with the new version
git tag -a "v%TAG_VERSION%" -m "Version %TAG_VERSION%"

:: Push the new tag to the remote repository
git push origin "v%TAG_VERSION%"

endlocal