import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
    const [form, setForm] = useState({ username: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                const { access_token } = await res.json();
                
                // 1. Store the token
                localStorage.setItem('token', access_token);

                // 2. Decode the token to get the role
                const decoded = jwtDecode(access_token);
                const role = decoded.sub.role; 

                // 3. Redirect to the appropriate home base
                // Using window.location.href ensures a full refresh to update App.js state
                window.location.href = role === 'Manager' ? '/dashboard' : '/worksheet';
            } else {
                alert('Login failed. Please check your credentials.');
            }
        } catch (error) {
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
                        onChange={e => setForm({...form, username: e.target.value})} 
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
                        onChange={e => setForm({...form, password: e.target.value})} 
                        required
                        autoComplete="current-password"
                    />
                </div>

                <button type="submit" className="login-button">Login</button>
            </form>
        </div>
    );
};

export default Login;