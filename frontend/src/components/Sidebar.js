import React from 'react';
import { Link } from 'react-router-dom';
import { getUserRole } from '../utils/auth';

const Sidebar = ({ isCollapsed }) => {
    const role = getUserRole();

    // RBAC: If not a manager, don't show the sidebar at all
    if (role?.toLowerCase() !== 'manager') return null;

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <ul>
                <li><Link to="/dashboard">📈 Dashboard</Link></li>
                <li><Link to="/staff">👥 Staff Management</Link></li>
                <li><Link to="/plans">📋 Client Plans</Link></li>
                <li><Link to="/reports">📊 Financial Reports</Link></li>
                <li><Link to="/worksheet">📊 Daily Worksheet</Link></li>
            </ul>
        </aside>
    );
};

export default Sidebar;