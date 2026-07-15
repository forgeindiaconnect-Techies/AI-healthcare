import API from './api';

export const availabilityService = {
  getAvailability: async ({ doctorId, signal }) => {
    if (!doctorId) {
      throw new Error("Doctor ID is required");
    }

    const response = await API.get('/api/doctors/availability', {
      signal
    });

    return response;
  }
};
