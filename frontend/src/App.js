import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard'; 
import DailyWorksheet from './pages/DailyWorksheet';
import './App.css';

function App() {
  return (
    <Router>
      {/* The 'App' class acts as the Flexbox parent. 
        It ensures the Login box is centered, but you may want to 
        adjust this class later when building full-screen dashboards.
      */}
      <div className="App">
        <Routes>
          {/* Phase 1: Authentication */}
          <Route path="/" element={<Login />} />
          
          {/* Phase 2 & 5: Manager Routes */}
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          
          {/* Phase 3: Detailer / Operations Routes */}
          <Route path="/daily-worksheet" element={<DailyWorksheet />} />

          {/* Fallback: Any unknown URL sends user back to Login */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;