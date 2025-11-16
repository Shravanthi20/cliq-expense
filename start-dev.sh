#!/bin/bash

# Finance Tracker Development Startup Script
echo "🚀 Starting Finance Tracker Development Environment..."

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found. Please create it with your MongoDB URI and JWT_SECRET."
    echo "Example .env file:"
    echo "MONGO_URI=mongodb://your-mongodb-connection-string"
    echo "JWT_SECRET=your-secret-key"
    exit 1
fi

# Start backend in background
echo "📡 Starting backend server..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend development server..."
cd frontend
npm install
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Both servers are starting up..."
echo "📡 Backend: http://localhost:5000"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
