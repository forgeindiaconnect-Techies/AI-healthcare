import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const ApprovedDoctorRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [isApproved, setIsApproved] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkDoctorStatus = async () => {
      if (!user || user.role !== 'doctor') {
        if (isMounted) setIsApproved(false);
        return;
      }

      try {
        const response = await api.get('/api/auth/me');
        const doctorData = response.data.data;
        
        if (doctorData && doctorData.profile) {
          const profile = doctorData.profile;
          if (profile.approvalStatus === 'approved' && profile.isVerified) {
            if (isMounted) setIsApproved(true);
          } else if (profile.approvalStatus === 'pending') {
            if (isMounted) setErrorStatus('pending');
          } else if (profile.approvalStatus === 'rejected') {
            if (isMounted) setErrorStatus('rejected');
          } else {
            if (isMounted) setIsApproved(false);
          }
        } else {
          if (isMounted) setIsApproved(false);
        }
      } catch (error) {
        if (isMounted) setIsApproved(false);
      }
    };

    if (!loading) {
      checkDoctorStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [user, loading]);

  if (loading || isApproved === null) {
    if (errorStatus) {
      if (errorStatus === 'pending') return <Navigate to="/approval-pending" replace />;
      if (errorStatus === 'rejected') return <Navigate to="/registration-rejected" replace />;
    }
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!user || user.role !== 'doctor') {
    return <Navigate to="/doctor-login" replace />;
  }

  if (errorStatus === 'pending') {
    return <Navigate to="/approval-pending" replace />;
  }

  if (errorStatus === 'rejected') {
    return <Navigate to="/registration-rejected" replace />;
  }

  if (!isApproved) {
    return <Navigate to="/doctor-login" replace />;
  }

  return children;
};

export default ApprovedDoctorRoute;
