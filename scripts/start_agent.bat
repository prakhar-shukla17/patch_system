@echo off
echo Starting Auto Agent...
echo Agent ID: test-agent-001
echo API Key: mysecretkey123
echo Server: http://localhost:5000
echo.

cd /d "%~dp0"
python auto_agent.py test-agent-001 mysecretkey123 http://localhost:5000

pause































