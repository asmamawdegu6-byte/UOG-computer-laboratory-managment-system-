import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import './TechViewSchedule.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: '08:00 - 10:00' },
  { start: '10:00', end: '12:00', label: '10:00 - 12:00' },
  { start: '12:00', end: '14:00', label: '12:00 - 14:00' },
  { start: '14:00', end: '16:00', label: '14:00 - 16:00' },
  { start: '16:00', end: '18:00', label: '16:00 - 18:00' },
];

const TechViewSchedule = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [timetable, setTimetable] = useState({
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: []
  });
  const [weekRange, setWeekRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);

  const getTechnicianCampus = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.campus || 'Atse Tewodros';
      }
    } catch (e) {
      console.error('Error getting campus:', e);
    }
    return 'Atse Tewodros';
  };

  const getWeekStart = useCallback((offset) => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff + offset * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [weekOffset, selectedYear, selectedSemester]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const campus = getTechnicianCampus();
      const weekStart = getWeekStart(weekOffset);
      
      const response = await api.get('/reservations/timetable', {
        params: { 
          weekStart: weekStart.toISOString(), 
          campus,
          year: selectedYear || undefined,
          semester: selectedSemester || undefined
        }
      });

      if (response.data.success) {
        setTimetable(response.data.timetable);
        setWeekRange({
          start: new Date(response.data.weekStart).toLocaleDateString(),
          end: new Date(response.data.weekEnd).toLocaleDateString()
        });
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: '#059669',
      pending: '#f59e0b',
      rejected: '#dc2626',
      completed: '#6b7280'
    };
    return colors[status] || colors.pending;
  };

  const flattenedTimetable = DAYS.flatMap(day => {
    const dayKey = day.toLowerCase();
    const sessions = timetable[dayKey] || [];
    return sessions.map(session => ({
      ...session,
      dayName: day,
      sortKey: `${dayKey}-${session.startTime}`
    }));
  });

  return (
    <DashboardLayout>
      <div className="view-schedule">
        <div className="page-header">
          <div>
            <h1>Lab Schedule</h1>
            <p className="page-description">View all scheduled classes and lab reservations</p>
          </div>
          <div className="filter-group" style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-with-label">
              <label>Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
              </select>
            </div>
            <div className="input-with-label">
              <label>Semester</label>
              <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                <option value="">All Semesters</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
              </select>
            </div>
            <div className="week-nav-btns" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setWeekOffset(prev => prev - 1)}>&larr; Prev</Button>
              <Button variant="secondary" onClick={() => setWeekOffset(0)}>Current Week</Button>
              <Button variant="secondary" onClick={() => setWeekOffset(prev => prev + 1)}>Next &rarr;</Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading schedule...</div>
        ) : (
          <Card title={`Full Schedule: ${weekRange.start} - ${weekRange.end}`} className="timetable-card">
            <div className="table-wrapper">
              <table className="schedule-list-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Group</th>
                    <th>Lab</th>
                    <th>Course</th>
                    <th>Technician</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {flattenedTimetable.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-row">No classes scheduled for the selected filters</td>
                    </tr>
                  ) : (
                    flattenedTimetable.map((session) => (
                    <tr key={session._id}>
                      <td className="day-cell"><strong>{session.dayName}</strong></td>
                      <td className="time-cell">{session.startTime} - {session.endTime}</td>
                      <td className="group-cell">Group {session.section}</td>
                      <td className="lab-cell">{session.roomName || session.lab?.name}</td>
                      <td className="course-cell">
                        <span className="course-code">{session.courseCode}</span>
                        <small className="course-name-sub">{session.courseName}</small>
                      </td>
                      <td className="tech-cell">👨‍🔧 {session.technician}</td>
                      <td>
                        <span className="status-pill" style={{ backgroundColor: getStatusColor(session.status) }}>
                          {session.status}
                        </span>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="timetable-legend" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '8px' }}>
          <strong>Legend:</strong>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', background: '#059669' }}></div> Approved
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', background: '#f59e0b' }}></div> Pending
          </span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TechViewSchedule;