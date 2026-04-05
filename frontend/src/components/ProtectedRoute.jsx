import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center',
        alignItems: 'center', height: '100vh',
        background: '#1a1a2e', color: '#FFD700',
        fontSize: '24px'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate page based on role
    if (user.role === 'child') return <Navigate to="/game" replace />;
    if (user.role === 'parent') return <Navigate to="/parent" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;