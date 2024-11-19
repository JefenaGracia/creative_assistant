// Layout.js
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import './Layout.css';

const Layout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); 
    } catch (error) {
      console.error('Error logging out:', error.message); 
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Creative Assistant</h2>
        <nav>
          <Link to="/teacherdashboard">Teacher Dashboard</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};
export default Layout;
