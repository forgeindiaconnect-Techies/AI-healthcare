import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import API from '../api/api';

const DoctorProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  const doctorToken = localStorage.getItem('doctorToken');

  useEffect(() => {
    let isMounted = true;
    const verifyDoctor = async () => {
      if (!doctorToken) {
        if (isMounted) setLoading(false);
        return;
      }
      
      try {
        const response = await API.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${doctorToken}` }
        });
        
        if (isMounted) {
          const doctorData = response.data.data;
          // Normalise role (e.g., if backend returns "Doctor", "DOCTOR", etc)
          const normalizedRole = doctorData?.role?.toLowerCase();
          
          if (normalizedRole === 'doctor') {
             setUser({
               ...doctorData,
               role: 'doctor',
               approvalStatus: doctorData.profile?.approvalStatus || doctorData.approvalStatus
             });
          }
        }
      } catch (error) {
        console.error("Doctor route verification failed", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyDoctor();
    
    return () => {
      isMounted = false;
    };
  }, [doctorToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!doctorToken) {
    return <Navigate to="/doctor-login" replace />;
  }

  if (!user) {
    return <Navigate to="/doctor-login" replace />;
  }

  if (user.role !== 'doctor') {
    return <Navigate to="/doctor-login" replace />;
  }

  if (user.approvalStatus === "pending") {
    return <Navigate to="/approval-pending" replace />;
  }

  if (user.approvalStatus === "rejected") {
    return <Navigate to="/registration-rejected" replace />;
  }

  return children;
};

export default DoctorProtectedRoute;
