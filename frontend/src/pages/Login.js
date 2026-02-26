import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';

// Import the centralized login API function
import { loginUser } from '../api/api';

const Login = () => {
    const [form, setForm] = useState({ username: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // 1️⃣ Send login request through centralized API handler
            const res = await loginUser(form);

            if (!res.ok) {
                // Backend likely returned 401 (invalid credentials)
                alert('Login failed. Please check your credentials.');
                return;
            }

            const { access_token } = await res.json();

            if (!access_token) {
                alert('Login failed. No token received.');
                return;
            }

            // 2️⃣ Store JWT in localStorage
            // This will be used automatically in authenticated API requests
            localStorage.setItem('token', access_token);

            // 3️⃣ Decode JWT to extract role
            // IMPORTANT:
            // Backend now stores:
            // identity (sub) = string user_id
            // additional_claims = { role: "Manager" | "Employee" }
            const decoded = jwtDecode(access_token);

            const role = decoded.role; // <-- UPDATED (was decoded.sub.role)

            if (!role) {
                console.warn("JWT does not contain role claim:", decoded);
                alert('Login failed. Invalid token structure.');
                localStorage.removeItem('token');
                return;
            }

            // 4️⃣ Redirect based on role
            // Full reload ensures App.js re-evaluates auth state
            window.location.href =
                role === 'Manager' ? '/dashboard' : '/worksheet';

        } catch (error) {
            // Handles network errors or server downtime
            console.error("Login error:", error);
            alert('Could not connect to the server.');
        }
    };

    return (
        <div className="login-container">
            <h1>PowerTrack Pro</h1>
            <h2>User Authentication</h2>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input 
                        id="username"
                        type="text" 
                        placeholder="Enter Username" 
                        value={form.username}
                        onChange={e => setForm({ ...form, username: e.target.value })}
                        required
                        autoComplete="username"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input 
                        id="password"
                        type="password" 
                        placeholder="Enter Password" 
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required
                        autoComplete="current-password"
                    />
                </div>

                <button type="submit" className="login-button">
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;