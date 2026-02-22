import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getUserRole } from './utils/auth';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard'; 
import DailyWorksheet from './pages/DailyWorksheet';
import ClientPlans from './pages/ClientPlans';
import StaffManagement from './pages/StaffManagement';
import Reports from './pages/Reports';

import './App.css';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [role, setRole] = useState(getUserRole());

  // Update role when token changes
  useEffect(() => {
    const handleStorageChange = () => setRole(getUserRole());
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isAuthenticated = !!localStorage.getItem('token');
  const isManager = role === 'Manager';

  return (
    <Router>
      <div className="App">
        {/* Only show Navbar if logged in */}
        {isAuthenticated && (
          <Navbar 
            toggleSidebar={() => setIsCollapsed(!isCollapsed)} 
            userName="User" 
          />
        )}

        {/* CONDITIONAL LAYOUT: 
          If not authenticated, show ONLY the Login page in its centering wrapper.
          If authenticated, show the dashboard structure (Sidebar + Main).
        */}
        {!isAuthenticated ? (
          <div className="login-page-wrapper">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        ) : (
          <div className="main-layout">
            {/* Sidebar only for Managers */}
            {isManager && <Sidebar isCollapsed={isCollapsed} />}

            <main className={`page-content ${!isManager ? 'full-width' : ''}`}>
              <Routes>
                {/* Redirect home to correct dashboard */}
                <Route path="/" element={<Navigate to={isManager ? "/dashboard" : "/worksheet"} />} />
                
                {/* Shared Route */}
                <Route path="/worksheet" element={<DailyWorksheet />} />

                {/* Protected Manager Routes */}
                <Route 
                  path="/dashboard" 
                  element={isManager ? <ManagerDashboard /> : <Navigate to="/worksheet" />} 
                />
                <Route 
                  path="/plans" 
                  element={isManager ? <ClientPlans /> : <Navigate to="/worksheet" />} 
                />
                <Route 
                  path="/staff" 
                  element={isManager ? <StaffManagement /> : <Navigate to="/worksheet" />} 
                />
                <Route 
                  path="/reports" 
                  element={isManager ? <Reports /> : <Navigate to="/worksheet" />} 
                />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;