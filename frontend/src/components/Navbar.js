import React from 'react';
import { Link } from 'react-router-dom'; // Use Link for internal navigation
import { getUserRole } from '../utils/auth';

const Navbar = ({ toggleSidebar, userName }) => {
    const role = getUserRole();
    const isManager = role === 'Manager';

    return (
        <nav className="navbar">
            <div className="nav-left">
                {/* 1. Only show toggle if user is a Manager */}
                {isManager && (
                    <button onClick={toggleSidebar} className="hamburger">
                        ☰
                    </button>
                )}

                {/* 2. Brand links to Dashboard for Manager, otherwise Worksheet/Home */}
                <Link to={isManager ? "/dashboard" : "/worksheet"} className="brand-link">
                    <span className="brand">PowerTrack Pro</span>
                </Link>
            </div>
            
            <div className="nav-right">
                <span className="user-info">{userName}</span>
                <span className={`badge ${isManager ? 'mgr' : 'det'}`}>
                    {role}
                </span>
                <button 
                    className="logout-btn"
                    onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;