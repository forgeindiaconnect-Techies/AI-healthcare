import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api/api';

export const useDoctorAvailability = (user) => {
  const [data, setData] = useState({ rules: [], slots: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  const fetchAvailability = async () => {
    const isAvailabilityRoute = location.pathname === '/dashboard/doctor/availability' || location.pathname.startsWith('/dashboard/doctor/availability/');
    const doctorId = user?.id || user?._id;

    if (!user || user.role !== 'doctor' || !doctorId || !isAvailabilityRoute) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await API.get('/api/doctors/availability');
      setData({ 
        rules: response.data?.rules || [], 
        slots: response.data?.slots || [] 
      });
    } catch (err) {
      console.error('Availability loading error:', err);
      setError(err.response?.data?.message || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isAvailabilityRoute = location.pathname === '/dashboard/doctor/availability' || location.pathname.startsWith('/dashboard/doctor/availability/');
    const doctorId = user?.id || user?._id;
    
    if (!user || user.role !== 'doctor' || !doctorId || !isAvailabilityRoute) {
      if (loading) setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await API.get('/api/doctors/availability', {
          signal: controller.signal
        });
        
        setData({ 
          rules: response.data?.rules || [], 
          slots: response.data?.slots || [] 
        });
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          return;
        }
        console.error('Availability loading error:', err);
        setError(err.response?.data?.message || 'Failed to load availability');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, [user, location.pathname]);

  return { 
    rules: data.rules, 
    slots: data.slots, 
    loading, 
    error, 
    refetch: fetchAvailability 
  };
};
