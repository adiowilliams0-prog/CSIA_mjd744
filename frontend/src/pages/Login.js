import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
    const [form, setForm] = useState({ username: '', password: '' });

    const handleSubmit = async (e) => {
            e.preventDefault();
            const res = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                const { access_token } = await res.json();
                
                // 1. Store the token for future API calls
                localStorage.setItem('token', access_token);

                // 2. Decode the token to extract the 'user_role' 
                // We look inside 'sub' because your app.py identity is an object
                const decoded = jwtDecode(access_token);
                const role = decoded.sub.role; 

                // 3. Conditional Redirection based on Phase requirements
                if (role === 'Manager') {
                    window.location.href = '/manager-dashboard';
                } else {
                    window.location.href = '/daily-worksheet';
                }
            } else {
                alert('Login failed. Please check your credentials.');
            }
        };

    return (
        <div className="login-container">
            {/* Matches Prototype Title */}
            <h1>PowerTrack Pro</h1>
            <h2>User Authentication</h2>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    {/* Added labels to match prototype design */}
                    <label>Username</label>
                    <input 
                        type="text" 
                        placeholder="Enter Username" 
                        value={form.username}
                        onChange={e => setForm({...form, username: e.target.value})} 
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input 
                        type="password" 
                        placeholder="Enter Password" 
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})} 
                        required
                    />
                </div>

                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;