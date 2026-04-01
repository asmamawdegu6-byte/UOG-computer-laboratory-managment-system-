import api from './api';

export const reportService = {
  // Get dashboard statistics
  getDashboard: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  // Get booking reports
  getBookingReports: async (params = {}) => {
    const response = await api.get('/reports/bookings', { params });
    return response.data;
  },

  // Get equipment reports
  getEquipmentReports: async (params = {}) => {
    const response = await api.get('/reports/equipment', { params });
    return response.data;
  },

  // Get maintenance reports
  getMaintenanceReports: async (params = {}) => {
    const response = await api.get('/reports/maintenance', { params });
    return response.data;
  },

  // Export report as CSV (downloads file)
  exportCSV: async (type, params = {}) => {
    const response = await api.get('/reports/export/csv', {
      params: { type, ...params },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { success: true };
  },

  // Export report as PDF (opens printable HTML in new window)
  exportPDF: (type, params = {}) => {
    const token = localStorage.getItem('token');
    const baseUrl = api.defaults.baseURL || 'http://localhost:5000/api';
    const queryParams = new URLSearchParams({ type, ...params }).toString();
    const url = `${baseUrl}/reports/export/pdf?${queryParams}`;

    // Open in new window with auth header via fetch
    return fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.text())
      .then(html => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
        }
        return { success: true };
      });
  },

  // Generate and send report to user group
  generateAndSendReport: async (data) => {
    const response = await api.post('/reports/generate', data);
    return response.data;
  },

  // Get staff performance metrics
  getStaffPerformance: async (params = {}) => {
    const response = await api.get('/reports/staff-performance', { params });
    return response.data;
  },

  // Get maintenance reminders
  getMaintenanceReminders: async () => {
    const response = await api.get('/reports/maintenance-reminders');
    return response.data;
  },

  // Send maintenance reminder notifications
  sendMaintenanceReminders: async () => {
    const response = await api.post('/reports/send-maintenance-reminders');
    return response.data;
  }
};
