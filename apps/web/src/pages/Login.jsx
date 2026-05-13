import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { storeUser } from '../services/auth.js';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', form);
      storeUser({ token: response.data.token, role: response.data.role });
      const dashboardPath = {
        ADMIN: '/admin',
        TEACHER: '/teacher',
        STUDENT: '/student',
      }[response.data.role] || '/';
      navigate(dashboardPath);
    } catch (err) {
      setError('Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page login">
      <div className="card">
        <h1>Student Progress Platform</h1>
        <p>Sign in to continue</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={handleChange} required />
          </label>
          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="hint">
          First time admin? <Link to="/bootstrap">Bootstrap admin account</Link>
        </div>
      </div>
    </div>
  );
}
