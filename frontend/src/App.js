import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Import pages that actually exist
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Logout from './pages/Logout';
import UploadData from './pages/UploadData';
import AddMembers from './pages/AddMembers';
import SplitExpense from './pages/SplitExpense';
import ForecastPage from './pages/ForecastPage';
import NotificationSettings from './pages/NotificationSettings';

import './App.css';
import './styles/forms.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>

              {/* ---------- Public routes ---------- */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ---------- Protected routes ---------- */}

              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <UploadData />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/add-members"
                element={
                  <ProtectedRoute>
                    <AddMembers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/split-expense"
                element={
                  <ProtectedRoute>
                    <SplitExpense />
                  </ProtectedRoute>
                }
              />

              {/* 🔮 Forecast */}
              <Route
                path="/forecast"
                element={
                  <ProtectedRoute>
                    <ForecastPage />
                  </ProtectedRoute>
                }
              />

              {/* 🔔 Notification Settings */}
              <Route
                path="/settings/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationSettings />
                  </ProtectedRoute>
                }
              />

              {/* Logout */}
              <Route path="/logout" element={<Logout />} />

              {/* ---------- Catch all ---------- */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
