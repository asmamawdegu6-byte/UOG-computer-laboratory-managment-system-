import api from './api';

export const bookingService = {
  // Get all bookings (admin only)
  getAllBookings: async (params = {}) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  getLabs: async () => {
    const response = await api.get('/labs');
    return response.data;
  },

  getWorkstations: async (labId) => {
    const response = await api.get(`/labs/${labId}/workstations`);
    return response.data;
  },

  checkAvailability: async (labId, date) => {
    const response = await api.get(`/labs/${labId}/availability`, { params: { date } });
    return response.data;
  },

  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  cancelBooking: async (bookingId) => {
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
  },

  getBookingHistory: async (filters) => {
    const response = await api.get('/bookings/history', { params: filters });
    return response.data;
  },

  createReservation: async (reservationData) => {
    const response = await api.post('/reservations', reservationData);
    return response.data;
  }
};
