const Reservation = require('../models/Reservation');
const Lab = require('../models/Lab');

// @route   GET /api/reservations/check-availability
// @desc    Check lab availability for a date/time
// @access  Private
exports.checkAvailability = async (req, res) => {
    try {
        const { labId, date, startTime, endTime } = req.query;

        if (!labId || !date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'labId, date, startTime, and endTime are required'
            });
        }

        const lab = await Lab.findById(labId);
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }

        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        const conflicts = await Reservation.find({
            lab: labId,
            status: 'approved',
            date: { $gte: startOfDay, $lte: endOfDay },
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
            ]
        }).populate('teacher', 'name');

        res.json({
            success: true,
            available: conflicts.length === 0,
            conflicts: conflicts.map(c => ({
                id: c._id,
                courseName: c.courseName,
                startTime: c.startTime,
                endTime: c.endTime,
                teacher: c.teacher?.name || 'Unknown'
            }))
        });
    } catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/reservations
// @desc    Get all reservations (admin/teacher)
// @access  Private
exports.getAllReservations = async (req, res) => {
    try {
        const { status, lab, myReservations, page = 1, limit = 20 } = req.query;
        let query = {};

        if (req.user.role === 'teacher') {
            if (myReservations === 'true') {
                query.teacher = req.user._id;
            } else {
                query.$or = [{ teacher: req.user._id }, { status: 'pending' }];
            }
        } else if (req.user.role === 'student') {
            query.status = 'approved';
        }

        if (status) query.status = status;
        if (lab) query.lab = lab;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const reservations = await Reservation.find(query)
            .populate('teacher', 'name email department')
            .populate('lab', 'name code')
            .populate('approvedBy', 'name')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ date: -1, startTime: 1 });

        const total = await Reservation.countDocuments(query);
        res.json({
            success: true,
            reservations,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        console.error('Get reservations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/reservations/my-reservations
// @desc    Get current teacher's reservations
// @access  Teacher/Admin
exports.getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ teacher: req.user._id })
            .populate('lab', 'name code location')
            .populate('approvedBy', 'name')
            .sort({ date: -1 });

        res.json({ success: true, reservations });
    } catch (error) {
        console.error('Get my reservations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   POST /api/reservations
// @desc    Create new reservation
// @access  Teacher/Admin
exports.createReservation = async (req, res) => {
    try {
        const { labId, courseName, courseCode, date, startTime, endTime,
            numberOfStudents, requiredWorkstations, description, recurring } = req.body;

        const lab = await Lab.findById(labId);
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }

        if (numberOfStudents > lab.capacity) {
            return res.status(400).json({
                success: false,
                message: `Number of students exceeds lab capacity (${lab.capacity})`
            });
        }

        const reservation = new Reservation({
            teacher: req.user._id,
            lab: labId,
            courseName,
            courseCode,
            date: new Date(date),
            startTime,
            endTime,
            numberOfStudents,
            requiredWorkstations,
            description,
            recurring
        });

        await reservation.save();

        res.status(201).json({
            success: true,
            message: 'Reservation request submitted successfully',
            reservation
        });
    } catch (error) {
        console.error('Create reservation error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   POST /api/reservations/recurring
// @desc    Create recurring reservations (timetable)
// @access  Teacher/Admin
exports.createRecurringReservations = async (req, res) => {
    try {
        const { labId, courseName, courseCode, startTime, endTime,
            numberOfStudents, requiredWorkstations, description,
            frequency, startDate, endDate, dayOfWeek } = req.body;

        if (!labId || !courseName || !courseCode || !startTime || !endTime || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const lab = await Lab.findById(labId);
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }

        if (numberOfStudents > lab.capacity) {
            return res.status(400).json({
                success: false,
                message: `Number of students exceeds lab capacity (${lab.capacity})`
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const reservations = [];
        const conflicts = [];

        let currentDate = new Date(start);

        while (currentDate <= end) {
            let shouldCreate = false;

            if (frequency === 'weekly') {
                // Check if current day matches the target day of week
                const targetDay = dayOfWeek !== undefined ? parseInt(dayOfWeek) : start.getDay();
                shouldCreate = currentDate.getDay() === targetDay;
            } else if (frequency === 'daily') {
                shouldCreate = true;
            } else if (frequency === 'biweekly') {
                const targetDay = dayOfWeek !== undefined ? parseInt(dayOfWeek) : start.getDay();
                const weeksDiff = Math.floor((currentDate - start) / (7 * 24 * 60 * 60 * 1000));
                shouldCreate = currentDate.getDay() === targetDay && weeksDiff % 2 === 0;
            } else if (frequency === 'monthly') {
                shouldCreate = currentDate.getDate() === start.getDate();
            }

            if (shouldCreate) {
                // Check for conflicts
                const dayStart = new Date(currentDate);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(currentDate);
                dayEnd.setHours(23, 59, 59, 999);

                const existingConflict = await Reservation.findOne({
                    lab: labId,
                    status: { $in: ['pending', 'approved'] },
                    date: { $gte: dayStart, $lte: dayEnd },
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                });

                if (existingConflict) {
                    conflicts.push({
                        date: currentDate.toISOString().split('T')[0],
                        conflictingCourse: existingConflict.courseName
                    });
                } else {
                    const reservation = new Reservation({
                        teacher: req.user._id,
                        lab: labId,
                        courseName,
                        courseCode,
                        date: new Date(currentDate),
                        startTime,
                        endTime,
                        numberOfStudents: numberOfStudents || 1,
                        requiredWorkstations,
                        description,
                        recurring: {
                            isRecurring: true,
                            frequency: frequency || 'weekly',
                            endDate: end
                        }
                    });
                    reservations.push(reservation);
                }
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Save all reservations
        const savedReservations = await Reservation.insertMany(reservations);

        res.status(201).json({
            success: true,
            message: `Created ${savedReservations.length} recurring reservation(s)`,
            reservations: savedReservations,
            conflicts: conflicts.length > 0 ? conflicts : undefined,
            summary: {
                totalCreated: savedReservations.length,
                conflictsSkipped: conflicts.length
            }
        });
    } catch (error) {
        console.error('Create recurring reservations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/reservations/timetable
// @desc    Get teacher's weekly timetable view
// @access  Teacher/Admin
exports.getTimetable = async (req, res) => {
    try {
        const { weekStart } = req.query;
        const teacherId = req.user.role === 'teacher' ? req.user._id : req.query.teacherId;

        let startOfWeek;
        if (weekStart) {
            startOfWeek = new Date(weekStart);
        } else {
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            startOfWeek = new Date(today);
            startOfWeek.setDate(diff);
        }
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const query = {
            date: { $gte: startOfWeek, $lte: endOfWeek },
            status: { $in: ['pending', 'approved'] }
        };

        if (teacherId) {
            query.teacher = teacherId;
        }

        const reservations = await Reservation.find(query)
            .populate('lab', 'name code location')
            .sort({ date: 1, startTime: 1 });

        // Organize by day of week
        const timetable = {
            monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
        };

        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        reservations.forEach(r => {
            const dayIndex = new Date(r.date).getDay();
            const dayName = dayNames[dayIndex];
            timetable[dayName].push({
                _id: r._id,
                courseName: r.courseName,
                courseCode: r.courseCode,
                lab: r.lab,
                startTime: r.startTime,
                endTime: r.endTime,
                numberOfStudents: r.numberOfStudents,
                status: r.status,
                isRecurring: r.recurring?.isRecurring || false
            });
        });

        res.json({
            success: true,
            timetable,
            weekStart: startOfWeek,
            weekEnd: endOfWeek
        });
    } catch (error) {
        console.error('Get timetable error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PATCH /api/reservations/:id/approve
// @desc    Approve reservation (admin only, with double-booking check)
// @access  Admin/Superadmin
exports.approveReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('lab', 'name');
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (reservation.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Reservation is already ${reservation.status}` });
        }

        // Check for double booking - find overlapping approved reservations
        const queryDate = new Date(reservation.date);
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        const conflicts = await Reservation.find({
            lab: reservation.lab._id,
            status: 'approved',
            _id: { $ne: reservation._id },
            date: { $gte: startOfDay, $lte: endOfDay },
            startTime: { $lt: reservation.endTime },
            endTime: { $gt: reservation.startTime }
        }).populate('teacher', 'name').populate('lab', 'name');

        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Cannot approve: Time slot conflicts with existing approved reservation(s)',
                conflicts: conflicts.map(c => ({
                    id: c._id,
                    courseName: c.courseName,
                    courseCode: c.courseCode,
                    date: c.date,
                    startTime: c.startTime,
                    endTime: c.endTime,
                    teacher: c.teacher?.name || 'Unknown',
                    lab: c.lab?.name || 'Unknown'
                }))
            });
        }

        reservation.status = 'approved';
        reservation.approvedBy = req.user._id;
        reservation.approvedAt = new Date();
        await reservation.save();

        res.json({ success: true, message: 'Reservation approved successfully', reservation });
    } catch (error) {
        console.error('Approve reservation error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PATCH /api/reservations/:id/reject
// @desc    Reject reservation (admin only)
// @access  Admin/Superadmin
exports.rejectReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (reservation.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Reservation is already ${reservation.status}` });
        }

        reservation.status = 'rejected';
        reservation.rejectionReason = req.body.reason;
        await reservation.save();

        res.json({ success: true, message: 'Reservation rejected', reservation });
    } catch (error) {
        console.error('Reject reservation error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   DELETE /api/reservations/:id
// @desc    Cancel reservation
// @access  Private
exports.cancelReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (reservation.teacher.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        reservation.status = 'cancelled';
        await reservation.save();

        res.json({ success: true, message: 'Reservation cancelled successfully' });
    } catch (error) {
        console.error('Cancel reservation error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/reservations/active-sessions
// @desc    Get currently active sessions for attendance (based on current date/time)
// @access  Private (any authenticated user)
exports.getActiveSessions = async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find approved reservations for today
        const sessions = await Reservation.find({
            status: 'approved',
            date: { $gte: today, $lt: tomorrow }
        })
            .populate('lab', 'name code location')
            .populate('teacher', 'name')
            .sort({ startTime: 1 });

        // Filter sessions that are currently active or upcoming today
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        
        const activeSessions = sessions.filter(session => {
            // Session is active if current time is before end time
            return session.endTime > currentTime;
        });

        res.json({
            success: true,
            sessions: activeSessions,
            currentTime: currentTime
        });
    } catch (error) {
        console.error('Get active sessions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
