import api from './api';

export const attendanceService = {
  // Get attendance records for a reservation
  getAttendance: async (reservationId) => {
    const response = await api.get(`/attendance/reservation/${reservationId}`);
    return response.data;
  },

  // Get attendance statistics for a reservation
  getStats: async (reservationId) => {
    const response = await api.get(`/attendance/stats/${reservationId}`);
    return response.data;
  },

  // Get session info (public)
  getSessionInfo: async (reservationId) => {
    const response = await api.get(`/attendance/session/${reservationId}`);
    return response.data;
  },

  // Mark attendance via QR scan (public)
  markByQRScan: async (reservationId, studentId) => {
    const response = await api.post('/attendance/qr-scan', { reservationId, studentId });
    return response.data;
  },

  // Mark attendance by student ID (teacher/admin)
  markByStudentId: async (reservationId, studentId, status = 'present') => {
    const response = await api.post('/attendance/mark-by-student-id', {
      reservationId,
      studentId,
      status
    });
    return response.data;
  },

  // Mark attendance by email or student ID (teacher/admin)
  markByEmail: async (reservationId, email) => {
    const response = await api.post('/attendance/mark-by-email', { reservationId, email });
    return response.data;
  },

  // Mark individual attendance (teacher/admin)
  markAttendance: async (reservationId, studentId, status, notes = '') => {
    const response = await api.post('/attendance/mark', {
      reservationId,
      studentId,
      status,
      notes
    });
    return response.data;
  },

  // Bulk mark attendance (teacher/admin)
  bulkMark: async (reservationId, attendanceRecords) => {
    const response = await api.post('/attendance/bulk-mark', {
      reservationId,
      attendanceRecords
    });
    return response.data;
  },

  // Check out a student (teacher/admin)
  checkOut: async (reservationId, studentId) => {
    const response = await api.post('/attendance/checkout', {
      reservationId,
      studentId
    });
    return response.data;
  }
};
