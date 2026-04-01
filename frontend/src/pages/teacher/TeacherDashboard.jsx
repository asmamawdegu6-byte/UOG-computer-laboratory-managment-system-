import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [stats, setStats] = useState([
    { label: 'Active Reservations', value: 0, icon: '📅' },
    { label: 'Total Students', value: 0, icon: '👨‍🎓' },
    { label: 'Materials Uploaded', value: 0, icon: '📤' },
    { label: 'Fault Reports', value: 0, icon: '🔧' }
  ]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [reservationsRes, materialsRes, faultsRes] = await Promise.all([
        api.get('/reservations/my-reservations'),
        api.get('/materials/my-materials'),
        api.get('/maintenance/faults'),
      ]);

      const reservations = reservationsRes.data.reservations || [];
      const materials = materialsRes.data.materials || [];
      const faults = faultsRes.data.faults || [];

      const activeReservations = reservations.filter(r => r.status === 'approved').length;
      const totalStudents = reservations.reduce((sum, r) => sum + (r.numberOfStudents || 0), 0);
      const materialsUploaded = materials.length;
      const faultReports = faults.filter(f => f.status === 'open' || f.status === 'in-progress').length;

      setStats([
        { label: 'Active Reservations', value: activeReservations, icon: '📅' },
        { label: 'Total Students', value: totalStudents, icon: '👨‍🎓' },
        { label: 'Materials Uploaded', value: materialsUploaded, icon: '📤' },
        { label: 'Fault Reports', value: faultReports, icon: '🔧' }
      ]);

      const upcoming = reservations
        .filter(r => r.status === 'approved' && new Date(r.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5)
        .map(r => ({
          id: r._id,
          subject: r.courseName,
          lab: r.lab?.name || 'N/A',
          date: new Date(r.date).toLocaleDateString(),
          time: `${r.startTime} - ${r.endTime}`,
          students: r.numberOfStudents
        }));

      setUpcomingClasses(upcoming);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="teacher-dashboard">
        <h1>Teacher Dashboard</h1>
        <p className="welcome-text">Manage your lab sessions and monitor student activity.</p>

        {loading ? (
          <div className="loading">Loading dashboard data...</div>
        ) : (
          <>
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <Card key={index} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </Card>
              ))}
            </div>

            <Card title="Upcoming Lab Sessions" className="sessions-card">
              {upcomingClasses.length === 0 ? (
                <div className="empty-state">No upcoming sessions</div>
              ) : (
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Lab</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingClasses.map((session) => (
                      <tr key={session.id}>
                        <td>{session.subject}</td>
                        <td>{session.lab}</td>
                        <td>{session.date}</td>
                        <td>{session.time}</td>
                        <td>{session.students}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;