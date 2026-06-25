import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DoctorProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (!user || user.role !== 'doctor') {
    // If the user is not authenticated as a doctor, redirect to doctor login
    return <Navigate to="/doctor-login" replace />;
  }

  return children;
};

export default DoctorProtectedRoute;
