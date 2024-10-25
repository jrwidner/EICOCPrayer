@echo off
:: 1. Install npm packages
call :ExecuteCmd npm install --production

:: 2. Build the project (if needed)
call :ExecuteCmd npm run build

:: 3. Copy files to the output directory
xcopy /s /y /i .\dist\* %DEPLOYMENT_TARGET%

:: 4. Exit
goto :EOF

:ExecuteCmd
echo %*
%*
IF !ERRORLEVEL! NEQ 0 goto error
goto :EOF

:error
echo Failed to execute command: %*
exit /b 1
