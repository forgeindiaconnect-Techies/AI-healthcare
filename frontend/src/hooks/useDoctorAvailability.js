import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { availabilityService } from '../api/availabilityService';

const getErrorMessage = (error) => {
  if (error.response) {
    if (error.response.status === 400) return "Invalid availability request";
    if (error.response.status === 401) return "Session expired. Please sign in again.";
    if (error.response.status === 403) return "You do not have permission to access this availability.";
    if (error.response.status === 404) return "Doctor profile was not found.";
    if (error.response.status === 500) return "Unable to load availability. Please try again.";
    return error.response.data?.message || error.message;
  }
  return error.message;
};

export const useDoctorAvailability = (user, isAuthReady) => {
  const [data, setData] = useState({ rules: [], slots: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);
  const location = useLocation();

  const isAvailabilityRoute = location.pathname === '/dashboard/doctor/availability' || location.pathname.startsWith('/dashboard/doctor/availability/');
  const doctorId = user?.id || user?._id;

  const refetch = async () => {
    if (!isAuthReady || !doctorId || user?.role !== "doctor" || !isAvailabilityRoute) return;
    
    try {
      setLoading(true);
      setError(null);
      setIsError(false);

      const response = await availabilityService.getAvailability({
        doctorId: doctorId,
        signal: undefined
      });

      if (response.status === 200) {
        setData({
          rules: response.data?.rules || [],
          slots: response.data?.slots || []
        });
      }
    } catch (error) {
      console.error({
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
        endpoint: error.config?.url,
      });
      setIsError(true);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthReady) return;
    if (!doctorId) return;
    if (user.role !== "doctor") return;
    if (!isAvailabilityRoute) {
      if (loading) setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsError(false);

        const response = await availabilityService.getAvailability({
          doctorId: doctorId,
          signal: controller.signal,
        });

        if (response.status === 200) {
          setData({
            rules: response.data?.rules || [],
            slots: response.data?.slots || []
          });
        }
      } catch (error) {
        if (error.name === "AbortError" || error.name === "CanceledError") return;

        console.error({
          message: error.message,
          status: error.response?.status,
          response: error.response?.data,
          endpoint: error.config?.url,
        });
        
        setIsError(true);
        setError(getErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadAvailability();

    return () => controller.abort();
  }, [isAuthReady, doctorId, user?.role, isAvailabilityRoute]);

  return {
    rules: data.rules,
    slots: data.slots,
    loading,
    isError,
    error,
    refetch,
    isAvailabilityRoute
  };
};
