import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { storeUser } from '../services/auth.js';

export default function AdminSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', secret: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/bootstrap-admin', { email: form.email, password: form.password }, {
        headers: { 'x-bootstrap-secret': form.secret },
      });
      storeUser({ token: response.data.token, role: response.data.role });
      navigate('/admin');
    } catch (err) {
      setError('Bootstrap failed. Check secret and details.');
    }
  };

  return (
    <div className="page login">
      <div className="card">
        <h1>Bootstrap Admin</h1>
        <p>Create the first admin account.</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Admin Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Admin Password
            <input name="password" type="password" value={form.password} onChange={handleChange} required />
          </label>
          <label>
            Bootstrap Secret
            <input name="secret" type="password" value={form.secret} onChange={handleChange} required />
          </label>
          <button className="primary" type="submit">Create Admin</button>
        </form>
      </div>
    </div>
  );
}
