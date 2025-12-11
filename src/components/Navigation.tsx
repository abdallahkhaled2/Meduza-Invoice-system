import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="no-print" style={{
      background: '#020617',
      borderBottom: '1px solid #1f2937',
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          gap: 8,
        }}>
          <Link
            to="/"
            style={{
              padding: '16px 20px',
              textDecoration: 'none',
              color: isActive('/') ? '#38bdf8' : '#e5e7eb',
              borderBottom: isActive('/') ? '2px solid #38bdf8' : '2px solid transparent',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            Create Invoice
          </Link>
          <Link
            to="/preview"
            style={{
              padding: '16px 20px',
              textDecoration: 'none',
              color: isActive('/preview') ? '#38bdf8' : '#e5e7eb',
              borderBottom: isActive('/preview') ? '2px solid #38bdf8' : '2px solid transparent',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            Preview
          </Link>
          <Link
            to="/dashboard"
            style={{
              padding: '16px 20px',
              textDecoration: 'none',
              color: isActive('/dashboard') ? '#38bdf8' : '#e5e7eb',
              borderBottom: isActive('/dashboard') ? '2px solid #38bdf8' : '2px solid transparent',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            Dashboard
          </Link>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 500,
            color: '#e5e7eb',
            backgroundColor: 'transparent',
            border: '1px solid #374151',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1f2937';
            e.currentTarget.style.borderColor = '#4b5563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#374151';
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
