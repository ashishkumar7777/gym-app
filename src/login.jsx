import React, { useState } from 'react';
import axios from 'axios';

import { useNavigate } from 'react-router-dom';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('https://gym-app-3-rrwg.onrender.com/login', form);
      console.log('Login success:', res.data);
      localStorage.setItem('token', res.data.token);
      alert('Logged in!');
      // Redirect to dashboard or member area
      // Redirect to users page
      //navigate('/');
     // navigate('/member-dashboard');
     if (form.email === 'gymowner@gmail.com') {
      navigate('/'); // Admin dashboard
    } else {
      navigate('/member-dashboard'); // Member dashboard
    }
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
