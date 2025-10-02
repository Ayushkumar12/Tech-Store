// src/Authentication/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './Authpro';

// Usage: <Protectroute roles={["admin", "seller"]}>...</Protectroute>
const Protectroute = ({ children, roles }) => {
  const { currentUser, userData } = useAuth();

  if (!currentUser) {
    return <Navigate to="/auth" />;
  }

  if (roles && roles.length > 0) {
    const role = userData?.role || 'customer';
    if (!roles.includes(role)) {
      return <Navigate to="/" />;
    }
  }

  return children;
};

export default Protectroute;
