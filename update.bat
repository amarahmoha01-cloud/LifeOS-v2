@echo off
cd /d "%~dp0"
title LifeOS - Publish Update
echo(
echo   Publishing LifeOS to your phone...
echo   --------------------------------------------
where git >nul 2>nul
if errorlevel 1 (
  echo   Git is not installed yet.
  echo   Get it from https://git-scm.com/download/win  ^(default options are fine^),
  echo   then double-click this file again.
  echo(
  pause & exit /b 1
)
if not exist ".git" (
  echo   This folder is not connected to GitHub yet.
  echo   Do the one-time setup in INSTALL-ON-PHONE.md ^(Part 1^) first.
  echo(
  pause & exit /b 1
)
echo   Syncing with GitHub...
git pull --rebase --autostash >nul 2>nul
git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo   Nothing new to publish - you are already up to date.
  echo(
  pause & exit /b 0
)
git commit -m "Update LifeOS %date% %time%" >nul
echo   Uploading to GitHub...
git push
if errorlevel 1 (
  echo(
  echo   Push failed. Open GitHub Desktop and click Push, or check your internet.
  echo(
  pause & exit /b 1
)
echo(
echo   Done. Netlify is deploying automatically now ^(about 30-60 seconds^).
echo   Then just open ^(or reopen^) LifeOS on your phone - it updates itself.
echo(
pause
