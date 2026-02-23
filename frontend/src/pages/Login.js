import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';

// Import the centralized login API function
import { loginUser } from '../api/api';

const Login = () => {
    const [form, setForm] = useState({ username: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Call the centralized API function instead of using fetch directly
            // This keeps all server communication inside api.js
            const res = await loginUser(form);

            if (res.ok) {
                const { access_token } = await res.json();
                
                // 1. Store the JWT token in localStorage
                // This allows authenticated requests later
                localStorage.setItem('token', access_token);

                // 2. Decode the token to extract the user's role
                // Flask stores identity inside "sub"
                const decoded = jwtDecode(access_token);
                const role = decoded.sub.role;

                // 3. Redirect based on role
                // Full page reload ensures App.js re-evaluates authentication state
                window.location.href =
                    role === 'Manager' ? '/dashboard' : '/worksheet';

            } else {
                // If backend returns 401 or 400
                alert('Login failed. Please check your credentials.');
            }

        } catch (error) {
            // Handles network/server errors
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