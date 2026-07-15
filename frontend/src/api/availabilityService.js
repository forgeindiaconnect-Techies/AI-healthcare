import API from './api';

export const availabilityService = {
  getMyAvailability: async ({ doctorId, signal }) => {
    if (!doctorId) {
      throw new Error("Doctor ID is required");
    }

    const response = await API.get('/api/doctors/availability', {
      signal,
      timeout: 15000
    });

    return response;
  },
  
  getUpcomingSlots: async ({ doctorId, signal }) => {
    if (!doctorId) {
      throw new Error("Doctor ID is required");
    }

    const response = await API.get('/api/doctors/slots/upcoming', {
      signal,
      timeout: 15000
    });

    return response;
  }
};
