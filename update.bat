@echo off
REM ============================================================
REM  LifeOS — one-click update.
REM  Double-click this after the app changes. It publishes the
REM  new version to your permanent URL; your phone then updates
REM  itself automatically the next time you open the app.
REM  (One-time setup required first — see INSTALL-ON-PHONE.md.)
REM ============================================================
cd /d "%~dp0"
echo Publishing the latest LifeOS...
git add -A
git commit -m "Update LifeOS"
git push
echo.
echo Done. Open (or reopen) LifeOS on your phone and it will refresh to the new version.
pause
