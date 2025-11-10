@echo off
echo Setting up Student Exercise Platform...
echo.

echo Setting up Backend...
cd backend
echo Installing backend dependencies...
call npm install
echo Backend dependencies installed!
echo.

echo Setting up Frontend...
cd ..\frontend
echo Installing frontend dependencies...
call npm install
echo Frontend dependencies installed!
echo.

echo Setup complete!
echo.
echo Next steps:
echo 1. Make sure MongoDB is running
echo 2. Run 'cd backend && node scripts/seedData.js' to seed the database
echo 3. Start backend: 'cd backend && npm run dev'
echo 4. Start frontend: 'cd frontend && npm start'
echo.
echo Access the application at http://localhost:3000
echo.
pause
