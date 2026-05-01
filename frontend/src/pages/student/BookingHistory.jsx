import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import './BookingHistory.css';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get('/bookings/history');
        if (response.data.success) {
          setBookings(response.data.bookings);
        }
      } catch (err) {
        console.error('Fetch history error:', err);
        setError('Failed to load booking history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getStatusBadge = (status) => {
    const config = {
      pending: { class: 'status-pending', label: 'Pending' },
      confirmed: { class: 'status-confirmed', label: 'Confirmed' },
      completed: { class: 'status-completed', label: 'Completed' },
      cancelled: { class: 'status-cancelled', label: 'Cancelled' },
      'no-show': { class: 'status-noshow', label: 'No Show' }
    };
    return <span className={`status-badge ${config[status]?.class || ''}`}>{config[status]?.label || status}</span>;
  };

  // Calculate stats
  const stats = {
    total: bookings.length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    hoursUsed: bookings
      .filter(b => b.status === 'completed')
      .reduce((acc) => acc + 2, 0)
  };

  return (
    <DashboardLayout>
      <div className="booking-history">
        <div className="page-header">
          <h1>Booking History</h1>
          <p>View your complete booking history and usage statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="history-stats">
          <div className="stat-card">
            <div className="stat-icon total">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Bookings</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon completed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.completed}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon cancelled">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.cancelled}</h3>
              <p>Cancelled</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon hours">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.hoursUsed}</h3>
              <p>Hours Used</p>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="history-container">
          <div className="history-header">
            <h2>All Bookings</h2>
            <button className="btn-export">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          </div>

          <div className="table-responsive">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Lab</th>
                  <th>Workstation</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td className="booking-id">#{booking._id.substring(booking._id.length - 6).toUpperCase()}</td>
                    <td>{booking.lab?.name || 'Unknown Lab'}</td>
                    <td>{booking.workstation?.workstationNumber || 'N/A'}</td>
                    <td>{new Date(booking.date).toLocaleDateString()}</td>
                    <td>{booking.startTime} - {booking.endTime}</td>
                    <td>{booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td>{booking.checkedOutAt ? new Date(booking.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td>{getStatusBadge(booking.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && <div className="loading-message">Loading history...</div>}
          {error && <div className="error-message" style={{ color: 'red', padding: '1rem' }}>{error}</div>}

          {!loading && !error && bookings.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3>No booking history</h3>
              <p>You haven't made any bookings yet.</p>
              <a href="/student/book" className="btn-book">Book a Workstation</a>
            </div>
          )}
        </div>

        {/* Usage Summary */}
        <div className="usage-summary">
          <h2>Usage Summary</h2>
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Most Used Lab</h4>
              <p className="highlight">Computer Lab A</p>
              <span>3 bookings</span>
            </div>
            <div className="summary-card">
              <h4>Favorite Time Slot</h4>
              <p className="highlight">09:00 - 11:00</p>
              <span>3 sessions</span>
            </div>
            <div className="summary-card">
              <h4>Attendance Rate</h4>
              <p className="highlight">85%</p>
              <span>Great job!</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookingHistory;
