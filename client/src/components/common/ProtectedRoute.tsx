import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'teacher' | 'accountant' | 'student')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');

  if (!token || !userRaw) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userRaw);
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to correct dashboard according to actual role
      if (user.role === 'admin') return <Navigate to="/admin" replace />;
      if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
      if (user.role === 'accountant') return <Navigate to="/accountant" replace />;
      if (user.role === 'student') return <Navigate to="/student" replace />;
      return <Navigate to="/login" replace />;
    }
  } catch (err) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
