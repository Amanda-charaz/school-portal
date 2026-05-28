import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, hasRole } from '../utils/authUtils';

const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={{ color: '#ef4444', marginBottom: '10px' }}>403 - Access Denied</h1>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>You don't have permission to access this page.</p>
          <button onClick={() => window.location.href = '/'} style={styles.button}>
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return children;
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  }
};

export default ProtectedRoute;
