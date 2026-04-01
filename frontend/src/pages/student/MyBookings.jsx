import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import Notification from '../../components/ui/Notification';
import './MyBookings.css';

const MyBookings = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showNotification('error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const categorizeBookings = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const active = [];
    const upcoming = [];
    const past = [];

    bookings.forEach(booking => {
      const bookingDate = new Date(booking.date);
      bookingDate.setHours(0, 0, 0, 0);

      if (booking.status === 'cancelled') {
        past.push(booking);
      } else if (bookingDate.getTime() === now.getTime() && booking.status !== 'completed') {
        active.push(booking);
      } else if (bookingDate > now && (booking.status === 'pending' || booking.status === 'confirmed')) {
        upcoming.push(booking);
      } else {
        past.push(booking);
      }
    });

    return { active, upcoming, past };
  };

  const categorizedBookings = categorizeBookings();

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { class: 'status-confirmed', label: 'Confirmed' },
      pending: { class: 'status-pending', label: 'Pending Approval' },
      completed: { class: 'status-completed', label: 'Completed' },
      cancelled: { class: 'status-cancelled', label: 'Cancelled' },
      'no-show': { class: 'status-cancelled', label: 'No Show' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await api.delete(`/bookings/${bookingId}`, {
        data: { reason: 'Cancelled by user' }
      });
      if (response.data.success) {
        showNotification('success', 'Booking cancelled successfully');
        fetchBookings();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const currentBookings = categorizedBookings[activeTab] || [];

  return (
    <DashboardLayout>
      <div className="my-bookings">
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
            position="top-right"
          />
        )}

        <div className="page-header">
          <h1>My Bookings</h1>
          <p>Manage your lab workstation bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="booking-stats">
          <div className="stat-card blue">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{categorizedBookings.active.length}</h3>
              <p>Active Today</p>
            </div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{categorizedBookings.upcoming.length}</h3>
              <p>Upcoming</p>
            </div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{categorizedBookings.past.length}</h3>
              <p>Past Bookings</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={activeTab === 'active' ? 'active' : ''}
              onClick={() => setActiveTab('active')}
            >
              Active ({categorizedBookings.active.length})
            </button>
            <button 
              className={activeTab === 'upcoming' ? 'active' : ''}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming ({categorizedBookings.upcoming.length})
            </button>
            <button 
              className={activeTab === 'past' ? 'active' : ''}
              onClick={() => setActiveTab('past')}
            >
              History ({categorizedBookings.past.length})
            </button>
          </div>

          {/* Bookings List */}
          <div className="bookings-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner-large"></div>
                <p>Loading bookings...</p>
              </div>
            ) : currentBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <h3>No bookings found</h3>
                <p>You don't have any {activeTab} bookings.</p>
                <a href="/student/book" className="btn-book">Book a Workstation</a>
              </div>
            ) : (
              currentBookings.map((booking) => (
                <div key={booking._id} className="booking-card">
                  <div className="booking-header">
                    <div className="booking-id">
                      <span>Booking ID</span>
                      <strong>{booking._id.slice(-8).toUpperCase()}</strong>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="booking-details">
                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="label">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                          Lab
                        </span>
                        <strong>{booking.lab?.name || 'N/A'}</strong>
                      </div>
                      <div className="detail-item">
                        <span className="label">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                          </svg>
                          Workstation
                        </span>
                        <strong>{booking.workstation?.workstationNumber || 'N/A'}</strong>
                      </div>
                    </div>

                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="label">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          Date
                        </span>
                        <strong>{formatDate(booking.date)}</strong>
                      </div>
                      <div className="detail-item">
                        <span className="label">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          Time
                        </span>
                        <strong>{booking.startTime} - {booking.endTime}</strong>
                      </div>
                    </div>

                    {booking.purpose && (
                      <div className="detail-row">
                        <div className="detail-item full-width">
                          <span className="label">Purpose</span>
                          <strong>{booking.purpose}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="booking-footer">
                    <span className="booking-date">Booked on {new Date(booking.createdAt).toLocaleDateString()}</span>
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button 
                        className="btn-cancel"
                        onClick={() => handleCancel(booking._id)}
                      >
                        Cancel Booking
                      </button>
                    )}
                    {booking.status === 'pending' && (
                      <div className="pending-notice">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        Waiting for admin approval
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyBookings;
