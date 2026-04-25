import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../contexts/NotificationContext';
import './Sidebar.css';

const CAMPUS_MENU_COLORS = {
    MAR: { primary: '#8e44ad', sidebar: 'linear-gradient(180deg, #6a1b9a 0%, #7b1fa2 50%, #9c27b0 100%)' },
    ATF: { primary: '#00bcd4', sidebar: 'linear-gradient(180deg, #00838f 0%, #0097a7 50%, #00bcd4 100%)' },
    HSC: { primary: '#4caf50', sidebar: 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%)' },
    ATW: { primary: '#9b59b6', sidebar: 'linear-gradient(180deg, #1a237e 0%, #283593 50%, #3949ab 100%)' }
};

const CAMPUS_NAME_TO_CODE = {
    'Maraki': 'MAR',
    'Atse Tewodros': 'ATW',
    'Atse Fasil': 'ATF',
    'Health Science College (GC)': 'HSC',
    'Health Science College': 'HSC'
};

const getCampusCode = () => {
    try {
        const stored = localStorage.getItem('selectedCampus');
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.code;
        }
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.campusCode) {
                return user.campusCode;
            }
            if (user.campus) {
                return CAMPUS_NAME_TO_CODE[user.campus] || user.campus;
            }
        }
    } catch (e) {
        console.error('Error getting campus code:', e);
    }
    return 'ATW';
};

const Sidebar = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const campusCode = getCampusCode();
  const campusColors = CAMPUS_MENU_COLORS[campusCode] || CAMPUS_MENU_COLORS.ATW;

  const getMenuItems = () => {
    switch (user?.role) {
      case 'student':
        return [
          {
            path: '/student/dashboard', label: 'Dashboard', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            ), color: '#3498db'
          },
          {
            path: '/student/availability', label: 'View Availability', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            ), color: '#2ecc71'
          },
          {
            path: '/student/book', label: 'Book Workstation', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            ), color: '#f39c12'
          },
          {
            path: '/student/bookings', label: 'My Bookings', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            ), color: '#9b59b6'
          },
          {
            path: '/student/report-fault', label: 'Report Fault', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ), color: '#e74c3c'
          },
          {
            path: '/student/materials', label: 'Download Material', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            ), color: '#1abc9c'
          },

          {
            path: '/student/history', label: 'Booking History', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ), color: '#e67e22'
          },
          {
            path: '/notifications', label: 'Notifications', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            ), badge: unreadCount, color: '#3498db'
          },
          {
            path: '/profile', label: 'My Profile', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            ), color: '#1abc9c'
          },
        ];
      case 'teacher':
        return [
          {
            path: '/teacher/dashboard', label: 'Dashboard', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            ), color: '#2ecc71'
          },
          {
            path: '/teacher/lab-reservation', label: 'Lab Reservation', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ), color: '#3498db'
          },
          {
            path: '/teacher/my-reservations', label: 'My Reservations', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            ), color: '#f39c12'
          },
          {
            path: '/teacher/manage-timetable', label: 'Manage Timetable', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" />
              </svg>
            ), color: '#9b59b6'
          },
          {
            path: '/teacher/upload-material', label: 'Upload Material', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            ), color: '#1abc9c'
          },
          {
            path: '/teacher/monitor-attendance', label: 'Monitor Attendance', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ), color: '#e67e22'
          },
          {
            path: '/teacher/attendance', label: 'Manual Attendance', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ), color: '#16a085'
          },
          {
            path: '/teacher/attendance-history', label: 'Attendance History', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ), color: '#3498db'
          },
          {
            path: '/teacher/availability', label: 'View Availability', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ), color: '#8e44ad'
          },
          {
            path: '/teacher/view-schedule', label: 'View Schedule', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ), color: '#e74c3c'
          },
          {
            path: '/teacher/fault-reports', label: 'Fault Reports', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ), color: '#f97316'
          },
          {
            path: '/notifications', label: 'Notifications', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            ), badge: unreadCount, color: '#3498db'
          },
          {
            path: '/profile', label: 'My Profile', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            ), color: '#1abc9c'
          },
        ];
      case 'technician':
        return [
          {
            path: '/technician/dashboard', label: 'Dashboard', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            ), color: '#3498db'
          },
          {
            path: '/technician/equipment', label: 'Equipment Status', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            ), color: '#2ecc71'
          },
          {
            path: '/technician/tickets', label: 'Maintenance Tickets', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h20" /><path d="M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10" /><path d="M12 2v10" />
              </svg>
            ), color: '#f39c12'
          },
          {
            path: '/technician/update-repair', label: 'Update Repair Status', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            ), color: '#9b59b6'
          },
          {
            path: '/technician/inventory', label: 'Inventory', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            ), color: '#1abc9c'
          },
          {
            path: '/technician/maintenance-log', label: 'Maintenance Log', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            ), color: '#e67e22'
          },
          {
            path: '/technician/fault-report', label: 'Report Fault', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ), color: '#e74c3c'
          },
          {
            path: '/technician/availability', label: 'View Availability', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ), color: '#8e44ad'
          },


          {
            path: '/technician/schedule', label: 'View Schedule', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ), color: '#16a085'
          },
          {
            path: '/technician/manage-booking', label: 'Manage Booking', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ), color: '#8b5cf6'
          },
          {
            path: '/technician/computer-check', label: 'Computer Check', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            ), color: '#dc2626'
          },
          {
            path: '/notifications', label: 'Notifications', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            ), badge: unreadCount, color: '#3498db'
          },
          {
            path: '/profile', label: 'My Profile', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            ), color: '#1abc9c'
          },
        ];
      case 'admin':
        return [
          {
            path: '/admin/dashboard', label: 'Dashboard', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            ), color: campusColors.primary
          },
          {
            path: '/admin/users', label: 'User Management', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            ), color: campusColors.primary
          },
          {
            path: '/admin/labs', label: 'Lab Management', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            ), color: campusColors.primary
          },
          {
            path: '/admin/workstations', label: 'Workstations', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            ), color: campusColors.primary
          },
          {
            path: '/admin/bookings', label: 'Bookings', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ), color: campusColors.primary
          },
          {
            path: '/admin/reservations', label: 'Lab Reservations', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            ), color: campusColors.primary
          },
          {
            path: '/admin/reports', label: 'Reports', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            ), color: campusColors.primary
          },
          {
            path: '/admin/conflicts', label: 'Conflicts', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            ), color: campusColors.primary
          },
          {
            path: '/admin/settings', label: 'Settings', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.24 4.24l-4.24-4.24M6.34 6.34L2.1 2.1" />
              </svg>
            ), color: campusColors.primary
          },
          {
            path: '/notifications', label: 'Notifications', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            ), badge: unreadCount, color: campusColors.primary
          },
          {
            path: '/profile', label: 'My Profile', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            ), color: campusColors.primary
          },
        ];
      case 'superadmin':
        return [
          {
            path: '/superadmin/dashboard', label: 'Dashboard', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            ), color: '#3498db'
          },
          {
            path: '/superadmin/campuses', label: 'Campus Management', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            ), color: '#2ecc71'
          },
          {
            path: '/superadmin/roles', label: 'Role Management', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            ), color: '#f39c12'
          },
          {
            path: '/superadmin/audit', label: 'Audit Logs', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            ), color: '#9b59b6'
          },
          {
            path: '/superadmin/config', label: 'System Config', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.24 4.24l-4.24-4.24M6.34 6.34L2.1 2.1" />
              </svg>
            ), color: '#1abc9c'
          },
          {
            path: '/notifications', label: 'Notifications', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            ), badge: unreadCount, color: '#3498db'
          },
          {
            path: '/profile', label: 'My Profile', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            ), color: '#1abc9c'
          },
        ];
      default:
        return [];
    }
  };

  const getRoleColor = () => {
    if (user?.role === 'superadmin') {
        return '#9b59b6';
    }
    if (user?.role === 'admin') {
        const code = getCampusCode();
        return code === 'ATW' ? '#9b59b6' : campusColors.primary;
    }
    switch (user?.role) {
      case 'student': return '#3498db';
      case 'teacher': return '#2ecc71';
      case 'technician': return '#f39c12';
      default: return '#3949ab';
    }
  };

  const menuItems = getMenuItems();
  const roleColor = getRoleColor();
  const roleLabel = user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1);

  return (
    <aside className="sidebar" style={{ background: campusColors.sidebar }}>
      <div className="sidebar-header" style={{ '--role-color': campusColors.primary }}>
        <div className="sidebar-logo">
          <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="12" width="48" height="32" rx="3" fill={roleColor} stroke={roleColor} strokeWidth="2" />
            <rect x="12" y="16" width="40" height="24" fill="#ecf0f1" />
            <rect x="15" y="20" width="14" height="3" fill="#2ecc71" rx="1" />
            <rect x="15" y="26" width="22" height="2" fill="#95a5a6" rx="1" />
            <rect x="15" y="30" width="18" height="2" fill="#95a5a6" rx="1" />
            <rect x="26" y="44" width="12" height="6" fill="#7f8c8d" />
            <rect x="20" y="50" width="24" height="4" rx="2" fill="#7f8c8d" />
            <circle cx="52" cy="8" r="3" fill="#e74c3c" />
            <circle cx="56" cy="14" r="2.5" fill="#f39c12" />
            <circle cx="50" cy="16" r="2" fill="#2ecc71" />
          </svg>
        </div>
        <div className="sidebar-brand">
          <h3>UOG-CLMS</h3>
          <span className="role-badge" style={{ backgroundColor: roleColor }}>{roleLabel}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-title">Main Menu</span>
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => isActive ? 'active' : ''}
                  style={{
                    '--active-color': item.color || roleColor,
                    backgroundColor: item.color || roleColor,
                    borderLeft: `3px solid ${item.color || roleColor}`
                  }}
                >
                  <span className="menu-icon" style={{ color: '#ffffff' }}>{item.icon}</span>
                  <span className="menu-label" style={{ color: '#ffffff' }}>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="menu-badge notification-badge-sidebar">{item.badge > 99 ? '99+' : item.badge}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="footer-info">
          <p>University of Gondar</p>
          <span>CLMS v1.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
