import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearStoredUser, getStoredUser } from '../services/auth.js';

export default function TopNav() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    clearStoredUser();
    navigate('/');
  };

  return (
    <nav className="topnav">
      <div className="brand">SPM</div>
      <div className="links">
        {user?.role === 'ADMIN' && (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/students">Students</Link>
          </>
        )}
        {user?.role === 'TEACHER' && <Link to="/teacher">Teacher Panel</Link>}
        {user?.role === 'STUDENT' && <Link to="/student">My Progress</Link>}
      </div>
      <button className="ghost" onClick={handleLogout}>Logout</button>
    </nav>
  );
}
