import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [isSharedDropdownOpen, setIsSharedDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const toggleSharedDropdown = () => {
    setIsSharedDropdownOpen((prev) => !prev);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            💰 FinTracker
          </Link>
        </div>

        {/* Menu */}
        <div className="navbar-menu">
          <div className="navbar-nav">
            {isAuthenticated() ? (
              <>
                <Link
                  to="/upload"
                  className={`navbar-link ${isActive('/upload') ? 'active' : ''}`}
                >
                  📊 Data Management
                </Link>

                {/* 🔽 Shared Account Dropdown */}
                <div className="navbar-dropdown">
                  <button
                    className="navbar-link dropdown-toggle"
                    onClick={toggleSharedDropdown}
                  >
                    🤝 Shared Account ▾
                  </button>

                  {isSharedDropdownOpen && (
                    <div className="dropdown-menu">
                      <Link
                        to="/add-members"
                        className={`dropdown-item ${isActive('/add-members') ? 'active' : ''}`}
                        onClick={() => setIsSharedDropdownOpen(false)}
                      >
                        👥 Create Group
                      </Link>
                      <Link
                        to="/split-expense"
                        className={`dropdown-item ${isActive('/split-expense') ? 'active' : ''}`}
                        onClick={() => setIsSharedDropdownOpen(false)}
                      >
                        💸 Split Expense
                      </Link>
                    </div>
                  )}
                </div>

                {/* Forecast */}
                <Link
                  to="/forecast"
                  className={`navbar-link ${isActive('/forecast') ? 'active' : ''}`}
                >
                  🤖 Forecast
                </Link>

                {/* 🔔 Single Notification Link (NO DROPDOWN) */}
                <Link
                  to="/settings/notifications"
                  className={`navbar-link ${isActive('/settings/notifications') ? 'active' : ''}`}
                >
                  🔔 Notifications
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`navbar-link ${isActive('/login') ? 'active' : ''}`}
                >
                  🔐 Login
                </Link>
                <Link
                  to="/register"
                  className={`navbar-link ${isActive('/register') ? 'active' : ''}`}
                >
                  📝 Register
                </Link>
              </>
            )}
          </div>

          {/* ✅ User Section */}
          {isAuthenticated() && (
            <div className="navbar-user">
              <span className="user-name">👋 Hello, {user?.name || 'User'}</span>
              <button onClick={handleLogout} className="logout-btn">
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Styling */}
      <style>{`
        .navbar {
          background: #1e293b;
          color: white;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-container {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-brand .navbar-logo {
          font-size: 1.3rem;
          font-weight: bold;
          color: white;
          text-decoration: none;
        }

        .navbar-menu {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .navbar-nav {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .navbar-link {
          color: white;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .navbar-link:hover {
          color: #38bdf8;
        }

        .navbar-link.active {
          border-bottom: 2px solid #38bdf8;
        }

        .navbar-dropdown {
          position: relative;
          display: inline-block;
        }

        .dropdown-toggle {
          background: none;
          border: none;
          cursor: pointer;
          color: inherit;
          font: inherit;
          padding: 0;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border: 1px solid #ddd;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          border-radius: 6px;
          min-width: 200px;
          z-index: 100;
          display: flex;
          flex-direction: column;
        }

        .dropdown-item {
          padding: 10px 15px;
          color: #333;
          text-decoration: none;
          transition: background 0.2s ease;
        }

        .dropdown-item:hover {
          background: #f3f3f3;
        }

        .dropdown-item.active {
          background: #2196f3;
          color: white;
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: 20px;
        }

        .logout-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 10px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .logout-btn:hover {
          background: #dc2626;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
