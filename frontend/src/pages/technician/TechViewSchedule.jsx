import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import './TechViewSchedule.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const FALLBACK_SLOTS = [
  { start: '08:00', end: '11:00', label: '08:00-11:00' },
  { start: '14:30', end: '16:30', label: '2:30-4:30' },
  { start: '16:30', end: '18:30', label: '4:30-6:30' }
];

const getTechnicianCampus = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.campus || user.campusCode || 'Atse Tewodros';
    }
  } catch (error) {
    console.error('Error getting campus:', error);
  }
  return 'Atse Tewodros';
};

const formatTimeForPaper = (time) => {
  if (!time) return '';
  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const minute = minuteText || '00';
  if (Number.isNaN(hour)) return time;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute}`;
};

const overlapsSlot = (session, slot) => (
  session.startTime < slot.end && session.endTime > slot.start
);

const TechViewSchedule = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedLab, setSelectedLab] = useState('');
  const [labs, setLabs] = useState([]);
  const [timetable, setTimetable] = useState({
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: []
  });
  const [weekRange, setWeekRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);

  const campus = getTechnicianCampus();

  const getWeekStart = useCallback((offset) => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const response = await api.get('/labs', { params: { campus, all: 'true' } });
        setLabs(response.data.labs || []);
      } catch (error) {
        console.error('Error fetching labs:', error);
      }
    };

    fetchLabs();
  }, [campus]);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
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
  }, [campus, getWeekStart, selectedSemester, selectedYear, weekOffset]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const allSessions = useMemo(() => (
    DAY_KEYS.flatMap(dayKey => (timetable[dayKey] || []).map(session => ({
      ...session,
      dayKey
    })))
  ), [timetable]);

  const visibleSessions = useMemo(() => (
    selectedLab
      ? allSessions.filter(session => (session.roomName || session.lab?.name) === selectedLab || session.lab?.name === selectedLab)
      : allSessions
  ), [allSessions, selectedLab]);

  const scheduleSlots = useMemo(() => {
    const slots = new Map();
    visibleSessions.forEach(session => {
      if (session.startTime && session.endTime) {
        const key = `${session.startTime}-${session.endTime}`;
        slots.set(key, {
          start: session.startTime,
          end: session.endTime,
          label: `${formatTimeForPaper(session.startTime)}-${formatTimeForPaper(session.endTime)}`
        });
      }
    });

    const sorted = Array.from(slots.values()).sort((a, b) => a.start.localeCompare(b.start));
    return sorted.length > 0 ? sorted : FALLBACK_SLOTS;
  }, [visibleSessions]);

  const scheduleTitle = selectedSemester
    ? `${selectedSemester === '1' ? 'First' : 'Second'} Semester Laboratory Schedule`
    : 'Laboratory Schedule';

  const getCellSessions = (dayKey, slot) => (
    visibleSessions.filter(session => session.dayKey === dayKey && overlapsSlot(session, slot))
  );

  return (
    <DashboardLayout>
      <div className="tech-schedule-page">
        <div className="page-header">
          <div>
            <h1>View Schedule</h1>
            <p className="page-description">Weekly laboratory schedule and assigned technical assistants</p>
          </div>
          <div className="schedule-filter-bar">
            <label>
              <span>Year</span>
              <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
                <option value="">All</option>
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th</option>
                <option value="5">5th</option>
              </select>
            </label>
            <label>
              <span>Semester</span>
              <select value={selectedSemester} onChange={(event) => setSelectedSemester(event.target.value)}>
                <option value="">All</option>
                <option value="1">1st</option>
                <option value="2">2nd</option>
              </select>
            </label>
            <label>
              <span>Lab</span>
              <select value={selectedLab} onChange={(event) => setSelectedLab(event.target.value)}>
                <option value="">All Labs</option>
                {labs.map(lab => (
                  <option key={lab._id} value={lab.name}>{lab.name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="schedule-week-nav">
          <Button variant="secondary" size="small" onClick={() => setWeekOffset(prev => prev - 1)}>Prev</Button>
          <div className="week-range">
            {weekRange.start} - {weekRange.end}
          </div>
          <Button variant="secondary" size="small" onClick={() => setWeekOffset(0)}>Current Week</Button>
          <Button variant="secondary" size="small" onClick={() => setWeekOffset(prev => prev + 1)}>Next</Button>
        </div>

        {loading ? (
          <div className="loading">Loading schedule...</div>
        ) : (
          <Card className="paper-schedule-card">
            <div className="paper-heading">
              <h2>{new Date().getFullYear()} Academic Year, {scheduleTitle}</h2>
              <p>Department of Information Technology, {selectedLab || 'All Labs'}</p>
              <p className="campus-line">{campus}</p>
            </div>

            <div className="paper-table-wrap">
              <table className="paper-schedule-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    {DAYS.map(day => (
                      <th key={day}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scheduleSlots.map(slot => (
                    <tr key={`${slot.start}-${slot.end}`}>
                      <td className="paper-time-cell">{slot.label}</td>
                      {DAY_KEYS.map(dayKey => {
                        const sessions = getCellSessions(dayKey, slot);
                        return (
                          <td key={dayKey} className={sessions.length > 0 ? 'paper-session-cell' : 'paper-idle-cell'}>
                            {sessions.length > 0 ? (
                              sessions.map(session => (
                                <div key={session._id} className="paper-session">
                                  <strong>{session.courseCode || session.courseName}</strong>
                                  {session.section && <span>Group {session.section}</span>}
                                  <em>{session.technician || 'Unassigned'}</em>
                                  <small>{session.roomName || session.lab?.name}</small>
                                </div>
                              ))
                            ) : (
                              <span className="idle-text">Idle</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="paper-note">
              <strong>Note:</strong>
              <span className="idle-sample" />
              <span>The idle time of the laboratory is designated for students to reserve and utilize for academic or project-related activities.</span>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TechViewSchedule;
