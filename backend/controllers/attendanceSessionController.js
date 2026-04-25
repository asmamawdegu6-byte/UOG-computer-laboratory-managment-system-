const AttendanceSession = require('../models/AttendanceSession');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

const buildSessionStartDate = (session) => {
    if (session?.reservation?.date && session?.reservation?.startTime) {
        const reservationDate = new Date(session.reservation.date);
        if (!Number.isNaN(reservationDate.getTime())) {
            const [hours, minutes] = session.reservation.startTime.split(':').map(Number);
            reservationDate.setHours(hours || 0, minutes || 0, 0, 0);
            return reservationDate;
        }
    }

    if (session?.startedAt) {
        return new Date(session.startedAt);
    }

    return null;
};

const getStoredAttendanceStatus = (requestedStatus, session) => {
    if (requestedStatus === 'absent') {
        return null;
    }

    if (requestedStatus === 'late') {
        return 'late';
    }

    const sessionStart = buildSessionStartDate(session);
    if (sessionStart && new Date() > sessionStart) {
        return 'late';
    }

    return 'present';
};

// Create a new attendance session
exports.createSession = async (req, res) => {
    try {
        const { year, semester, department, courseCode, campus, reservationId } = req.body;

        const session = new AttendanceSession({
            year,
            semester,
            department,
            courseCode,
            campus,
            teacher: req.user._id,
            reservation: reservationId,
            status: 'generated'
        });

        await session.save();

        res.status(201).json({
            success: true,
            message: 'Session created successfully',
            session
        });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get all sessions for teacher
exports.getSessions = async (req, res) => {
    try {
        const { status, page = 1, limit = 100, reservationId } = req.query;
        
        let query = { teacher: req.user._id };
        if (status) query.status = status;
        if (reservationId) query.reservation = reservationId;

        const sessions = await AttendanceSession.find(query)
            .populate('teacher', 'firstName lastName')
            .populate('reservation', 'courseName courseCode date startTime endTime')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await AttendanceSession.countDocuments(query);

        res.json({
            success: true,
            sessions,
            pagination: { page: parseInt(page), limit: parseInt(limit), total }
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get session by ID
exports.getSessionById = async (req, res) => {
    try {
        const session = await AttendanceSession.findById(req.params.id)
            .populate('teacher', 'firstName lastName');

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.json({ success: true, session });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Start a session
exports.startSession = async (req, res) => {
    try {
        const session = await AttendanceSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        if (session.status !== 'generated') {
            return res.status(400).json({ success: false, message: 'Session cannot be started' });
        }

        session.status = 'active';
        session.startedAt = new Date();
        await session.save();

        res.json({
            success: true,
            message: 'Session started successfully',
            session
        });
    } catch (error) {
        console.error('Start session error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// End a session
exports.endSession = async (req, res) => {
    try {
        const session = await AttendanceSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        session.status = 'completed';
        session.endedAt = new Date();
        await session.save();

        res.json({
            success: true,
            message: 'Session ended successfully',
            session
        });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get students for a session with their attendance
exports.getSessionStudents = async (req, res) => {
    try {
        const session = await AttendanceSession.findById(req.params.sessionId);

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        // Get students based on session filters
        const students = await User.find({
            role: 'student',
            isActive: true,
            year: session.year,
            semester: session.semester,
            department: session.department,
            campus: session.campus
        }).select('firstName lastName username email studentId year semester department');

        // Get existing attendance records - check BOTH session AND reservation
        const attendanceRecords = await Attendance.find({
            $or: [
                { session: session._id },
                { reservation: session.reservation }
            ]
        });

        // Map attendance to students
        const studentsWithAttendance = students.map(student => {
            const attendance = attendanceRecords.find(a => 
                a.student.toString() === student._id.toString()
            );
            return {
                ...student.toObject(),
                attendanceStatus: attendance?.status || 'absent',
                attendanceId: attendance?._id,
                markedAt: attendance?.checkInTime
            };
        });

        res.json({
            success: true,
            students: studentsWithAttendance,
            total: students.length
        });
    } catch (error) {
        console.error('Get session students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Mark student attendance
exports.markStudentAttendance = async (req, res) => {
    try {
        const { studentId, status } = req.body;
        const sessionId = req.params.sessionId;

        const session = await AttendanceSession.findById(sessionId).populate('reservation', 'date startTime');
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        const normalizedStudentId = String(studentId).trim();

        let student = null;

        if (/^[0-9a-fA-F]{24}$/.test(normalizedStudentId)) {
            student = await User.findOne({
                _id: normalizedStudentId,
                role: 'student'
            });
        }

        if (!student) {
            // Fall back to studentId/username lookup so both manual UI and typed IDs work.
            student = await User.findOne({
                role: 'student',
                $or: [
                    { studentId: { $regex: new RegExp(`^${normalizedStudentId}$`, 'i') } },
                    { username: { $regex: new RegExp(`^${normalizedStudentId}$`, 'i') } }
                ]
            });
        }

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (!student.isActive) {
            return res.status(400).json({ success: false, message: 'Student account is deactivated' });
        }

        const storedStatus = getStoredAttendanceStatus(status, session);

        // Check if attendance already exists
        let attendance = await Attendance.findOne({
            session: sessionId,
            student: student._id
        });

        if (!storedStatus) {
            if (attendance) {
                await Attendance.deleteOne({ _id: attendance._id });
            }

            return res.json({
                success: true,
                message: 'Student marked absent',
                attendance: null,
                status: 'absent'
            });
        }

        if (attendance) {
            // Update existing attendance
            attendance.status = storedStatus;
            attendance.checkInTime = attendance.checkInTime || new Date();
            attendance.markedBy = req.user._id;
            await attendance.save();
        } else {
            // Create new attendance - include both session AND reservation for proper tracking
            attendance = new Attendance({
                session: sessionId,
                reservation: session.reservation,
                student: student._id,
                status: storedStatus,
                checkInTime: new Date(),
                markedBy: req.user._id
            });
            await attendance.save();
        }

        res.json({
            success: true,
            message: 'Attendance marked successfully',
            attendance,
            status: storedStatus
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
