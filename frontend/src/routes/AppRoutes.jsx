import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Layouts
import AuthLayout from '../components/layout/AuthLayout';

// Public Pages
import Home from '../pages/public/Home';
import About from '../pages/public/About';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import ViewAvailability from '../pages/student/ViewAvailability';
import BookWorkstation from '../pages/student/BookWorkstation';
import MyBookings from '../pages/student/MyBookings';
import ReportFault from '../pages/student/ReportFault';
import DownloadMaterial from '../pages/student/DownloadMaterial';
import BookingHistory from '../pages/student/BookingHistory';

// Teacher Pages
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import LabReservation from '../pages/teacher/LabReservation';
import UploadMaterial from '../pages/teacher/UploadMaterial';
import MonitorAttendance from '../pages/teacher/MonitorAttendance';
import ViewSchedule from '../pages/teacher/ViewSchedule';
import FaultReports from '../pages/teacher/FaultReports';
import MyReservations from '../pages/teacher/MyReservations';
import ManageTimetable from '../pages/teacher/ManageTimetable';

// Technician Pages
import TechnicianDashboard from '../pages/technician/TechnicianDashboard';
import MaintenanceTickets from '../pages/technician/MaintenanceTickets';
import EquipmentStatus from '../pages/technician/EquipmentStatus';
import InventoryManagement from '../pages/technician/InventoryManagement';
import MaintenanceLog from '../pages/technician/MaintenanceLog';
import UpdateRepairStatus from '../pages/technician/UpdateRepairStatus';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import LabManagement from '../pages/admin/LabManagement';
import BookingManagement from '../pages/admin/BookingManagement';
import Reports from '../pages/admin/Reports';
import SystemSettings from '../pages/admin/SystemSettings';
import WorkstationManagement from '../pages/admin/WorkstationManagement';
import ConflictDetection from '../pages/admin/ConflictDetection';
import FaultManagement from '../pages/admin/FaultManagement';
import ReservationManagement from '../pages/admin/ReservationManagement';

// Superadmin Pages
import SuperAdminDashboard from '../pages/superadmin/SuperAdminDashboard';
import CampusManagement from '../pages/superadmin/CampusManagement';
import UserRoleManagement from '../pages/superadmin/UserRoleManagement';
import AuditLogs from '../pages/superadmin/AuditLogs';
import SystemConfiguration from '../pages/superadmin/SystemConfiguration';

// Common Pages (accessible by all roles)
import MyProfile from '../pages/common/MyProfile';
import NotificationsPage from '../pages/common/NotificationsPage';

// Public Pages
import ScanAttendance from '../pages/student/ScanAttendance';

// Route Guards
import PrivateRoute from './PrivateRoute';
import RoleBasedRoute from './RoleBasedRoute';

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();
  console.log('[DEBUG] AppRoutes.jsx: Rendering - isAuthenticated:', isAuthenticated, 'user:', user);

  return (
    <Routes>
      {/* Public Landing Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Public QR Attendance Scan Page */}
      <Route path="/attendance/scan" element={<ScanAttendance />} />

      {/* Student Routes */}
      <Route element={<RoleBasedRoute allowedRoles={['student']} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/availability" element={<ViewAvailability />} />
        <Route path="/student/book" element={<BookWorkstation />} />
        <Route path="/student/bookings" element={<MyBookings />} />
        <Route path="/student/report-fault" element={<ReportFault />} />
        <Route path="/student/materials" element={<DownloadMaterial />} />
        <Route path="/student/history" element={<BookingHistory />} />
      </Route>

      {/* Teacher Routes */}
      <Route element={<RoleBasedRoute allowedRoles={['teacher']} />}>
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/lab-reservation" element={<LabReservation />} />
        <Route path="/teacher/upload-material" element={<UploadMaterial />} />
        <Route path="/teacher/monitor-attendance" element={<MonitorAttendance />} />
        <Route path="/teacher/view-schedule" element={<ViewSchedule />} />
        <Route path="/teacher/fault-reports" element={<FaultReports />} />
        <Route path="/teacher/my-reservations" element={<MyReservations />} />
        <Route path="/teacher/manage-timetable" element={<ManageTimetable />} />
      </Route>

      {/* Technician Routes */}
      <Route element={<RoleBasedRoute allowedRoles={['technician']} />}>
        <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
        <Route path="/technician/tickets" element={<MaintenanceTickets />} />
        <Route path="/technician/equipment" element={<EquipmentStatus />} />
        <Route path="/technician/inventory" element={<InventoryManagement />} />
        <Route path="/technician/maintenance-log" element={<MaintenanceLog />} />
        <Route path="/technician/update-repair" element={<UpdateRepairStatus />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<RoleBasedRoute allowedRoles={['admin', 'superadmin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/labs" element={<LabManagement />} />
        <Route path="/admin/bookings" element={<BookingManagement />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/settings" element={<SystemSettings />} />
        <Route path="/admin/workstations" element={<WorkstationManagement />} />
        <Route path="/admin/conflicts" element={<ConflictDetection />} />
        <Route path="/admin/faults" element={<FaultManagement />} />
        <Route path="/admin/reservations" element={<ReservationManagement />} />
      </Route>

      {/* Superadmin Routes */}
      <Route element={<RoleBasedRoute allowedRoles={['superadmin']} />}>
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/campuses" element={<CampusManagement />} />
        <Route path="/superadmin/roles" element={<UserRoleManagement />} />
        <Route path="/superadmin/audit" element={<AuditLogs />} />
        <Route path="/superadmin/config" element={<SystemConfiguration />} />
      </Route>

      {/* Common Routes (accessible by all authenticated users) */}
      <Route element={<PrivateRoute />}>
        <Route path="/profile" element={<MyProfile />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;