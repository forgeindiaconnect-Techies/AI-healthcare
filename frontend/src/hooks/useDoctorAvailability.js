import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { availabilityService } from '../api/availabilityService';

const getErrorMessage = (error) => {
  if (error.code === 'ECONNABORTED') return "Request timed out. Please try again.";
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

export const useDoctorAvailability = (user, authLoading) => {
  const [availability, setAvailability] = useState([]);
  const [slots, setSlots] = useState([]);

  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [availabilityError, setAvailabilityError] = useState(null);
  const [slotsError, setSlotsError] = useState(null);

  const location = useLocation();
  const isAvailabilityRoute = location.pathname === '/dashboard/doctor/availability' || location.pathname.startsWith('/dashboard/doctor/availability/');
  
  const doctorId = user?.id || user?._id || null;

  const fetchAvailability = useCallback(async (signal) => {
    if (!doctorId) {
      setAvailability([]);
      setAvailabilityLoading(false);
      setAvailabilityError("Doctor profile not found");
      return;
    }

    try {
      setAvailabilityLoading(true);
      setAvailabilityError(null);

      const response = await availabilityService.getMyAvailability({
        doctorId,
        signal,
      });

      const records = response?.data?.data ?? response?.data ?? [];
      setAvailability(Array.isArray(records) ? records : []);
    } catch (error) {
      if (error?.name === "AbortError" || error?.name === "CanceledError") return;

      console.error("Failed to fetch doctor availability", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
      });

      setAvailability([]);
      setAvailabilityError(getErrorMessage(error));
    } finally {
      setAvailabilityLoading(false);
    }
  }, [doctorId]);

  const fetchUpcomingSlots = useCallback(async (signal) => {
    if (!doctorId) {
      setSlots([]);
      setSlotsLoading(false);
      setSlotsError("Doctor profile not found");
      return;
    }

    try {
      setSlotsLoading(true);
      setSlotsError(null);

      const response = await availabilityService.getUpcomingSlots({
        doctorId,
        signal,
      });

      const records = response?.data?.data ?? response?.data ?? [];
      setSlots(Array.isArray(records) ? records : []);
    } catch (error) {
      if (error?.name === "AbortError" || error?.name === "CanceledError") return;

      console.error("Failed to fetch upcoming slots", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
      });

      setSlots([]);
      setSlotsError(getErrorMessage(error));
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== "doctor" || !isAvailabilityRoute) {
      setAvailabilityLoading(false);
      setSlotsLoading(false);
      return;
    }

    if (!doctorId) {
      setAvailability([]);
      setSlots([]);
      setAvailabilityLoading(false);
      setSlotsLoading(false);
      setAvailabilityError("Doctor profile not found");
      return;
    }

    const controller = new AbortController();

    fetchAvailability(controller.signal);
    fetchUpcomingSlots(controller.signal);

    return () => {
      controller.abort();
    };
  }, [authLoading, user?.role, doctorId, isAvailabilityRoute, fetchAvailability, fetchUpcomingSlots]);

  const refetchBoth = async () => {
    await Promise.allSettled([
      fetchAvailability(),
      fetchUpcomingSlots(),
    ]);
  };

  return {
    availability,
    slots,
    availabilityLoading,
    slotsLoading,
    availabilityError,
    slotsError,
    fetchAvailability,
    fetchUpcomingSlots,
    refetchBoth,
    isAvailabilityRoute
  };
};
