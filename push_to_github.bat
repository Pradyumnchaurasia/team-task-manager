@echo off
title Push Project to GitHub - Team Task Manager
color 0b

echo ==============================================================
echo   🚀 TEAM TASK MANAGER - AUTOMATED GITHUB UPLOAD HELPER
echo ==============================================================
echo.

:: Check if Git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [❌ ERROR] Git is not installed or not in your system PATH!
    echo.
    echo Opening Git download page in your browser...
    start "" "https://git-scm.com/download/win"
    echo.
    echo Please install Git from the webpage that just opened,
    echo restart this terminal, and run this script again.
    echo.
    pause
    exit /b
)

echo [✓] Git detected successfully!
echo.

:: Initialize git repository
if not exist ".git" (
    echo [*] Initializing Git repository...
    git init
) else (
    echo [*] Git repository already initialized.
)

:: Add files
echo [*] Staging project files...
git add .

:: Commit files
echo [*] Committing project files...
git commit -m "feat: initial commit for full-stack team task manager with custom glassmorphism"

:: Set branch name
git branch -M main

echo.
echo ==============================================================
echo [⚙️  ACTION REQUIRED]
echo Please verify that you have created a repository named:
echo "team-task-manager"
echo on your GitHub account (https://github.com/Pradyumnchaurasia).
echo ==============================================================
echo.
echo Press any key ONCE you have created the repository on GitHub...
pause >nul

:: Link and Push
echo.
echo [*] Linking local repository to GitHub...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/Pradyumnchaurasia/team-task-manager.git

echo.
echo [*] Pushing files to GitHub (You may be prompted to log in)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ==============================================================
    echo 🎉 SUCCESS! Your project has been uploaded to:
    echo https://github.com/Pradyumnchaurasia/team-task-manager
    echo ==============================================================
) else (
    echo.
    echo [❌ ERROR] Push failed. Make sure the repository exists
    echo on GitHub and you are authenticated.
)

echo.
pause
