const Booking = require('../models/Booking');
const Lab = require('../models/Lab');
const { notifyByRole, createNotification } = require('./notificationController');

// @route   GET /api/bookings
// @desc    Get all bookings (admin only)
// @access  Admin/Superadmin
exports.getAllBookings = async (req, res) => {
    try {
        const { status, lab, date, page = 1, limit = 20 } = req.query;
        let query = {};
        if (status) query.status = status;
        if (lab) query.lab = lab;
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const bookings = await Booking.find(query)
            .populate('user', 'name username email')
            .populate('lab', 'name code')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ date: -1, startTime: 1 });

        const total = await Booking.countDocuments(query);
        res.json({
            success: true,
            bookings,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/bookings/my-bookings
// @desc    Get current user's bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
    try {
        const { status, upcoming } = req.query;
        let query = { user: req.user._id };
        if (status) query.status = status;
        if (upcoming === 'true') {
            query.date = { $gte: new Date() };
            query.status = { $in: ['pending', 'confirmed'] };
        }

        const bookings = await Booking.find(query)
            .populate('lab', 'name code location')
            .sort({ date: -1, startTime: 1 });

        res.json({ success: true, bookings });
    } catch (error) {
        console.error('Get my bookings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/bookings/history
// @desc    Get booking history with filters
// @access  Private
exports.getBookingHistory = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        let query = { user: req.user._id };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        if (status) query.status = status;

        const bookings = await Booking.find(query)
            .populate('lab', 'name code location')
            .sort({ date: -1 });

        res.json({ success: true, bookings });
    } catch (error) {
        console.error('Get booking history error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
exports.createBooking = async (req, res) => {
    try {
        const { labId, workstationId, date, startTime, endTime, purpose } = req.body;

        const lab = await Lab.findById(labId);
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }

        const workstation = lab.workstations.id(workstationId);
        if (!workstation) {
            return res.status(404).json({ success: false, message: 'Workstation not found' });
        }

        const overlap = await Booking.checkOverlap(labId, workstationId, date, startTime, endTime);
        if (overlap) {
            return res.status(409).json({ success: false, message: 'Time slot is already booked' });
        }

        const booking = new Booking({
            user: req.user._id,
            lab: labId,
            workstation: { workstationId: workstation._id, workstationNumber: workstation.workstationNumber },
            date: new Date(date),
            startTime,
            endTime,
            purpose
        });

        await booking.save();

        workstation.status = 'reserved';
        await lab.save();

        // Notify user about booking creation
        await createNotification({
            recipient: req.user._id,
            type: 'booking_created',
            title: 'Booking Created',
            message: `Your booking for ${lab.name} (${workstation.workstationNumber}) on ${new Date(date).toLocaleDateString()} has been submitted.`,
            link: '/student/my-bookings',
            priority: 'medium',
            relatedModel: 'Booking',
            relatedId: booking._id
        });

        // Notify admins about new booking
        await notifyByRole(['admin', 'superadmin'], {
            sender: req.user._id,
            type: 'booking_created',
            title: 'New Booking Request',
            message: `${req.user.name} booked ${lab.name} (${workstation.workstationNumber}) on ${new Date(date).toLocaleDateString()} from ${startTime} to ${endTime}`,
            link: '/admin/bookings',
            priority: 'low',
            relatedModel: 'Booking',
            relatedId: booking._id
        });

        res.status(201).json({ success: true, message: 'Booking created successfully', booking });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   DELETE /api/bookings/:id
// @desc    Cancel booking
// @access  Private
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.user.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Booking already cancelled' });
        }

        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancellationReason = req.body.reason || 'User cancelled';
        await booking.save();

        const lab = await Lab.findById(booking.lab);
        if (lab) {
            const workstation = lab.workstations.id(booking.workstation.workstationId);
            if (workstation) {
                workstation.status = 'available';
                await lab.save();
            }
        }

        // Notify the booking owner about cancellation
        await createNotification({
            recipient: booking.user,
            sender: req.user._id,
            type: 'booking_cancelled',
            title: 'Booking Cancelled',
            message: `Your booking for ${lab?.name || 'a lab'} on ${new Date(booking.date).toLocaleDateString()} has been cancelled.`,
            link: '/student/my-bookings',
            priority: 'medium',
            relatedModel: 'Booking',
            relatedId: booking._id
        });

        res.json({ success: true, message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PATCH /api/bookings/:id/status
// @desc    Update booking status (admin only)
// @access  Admin/Superadmin
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        booking.status = status;
        if (status === 'cancelled') {
            booking.cancelledAt = new Date();
        }
        await booking.save();
        await booking.populate('user lab');

        // Update workstation status if cancelled
        if (status === 'cancelled') {
            const lab = await Lab.findById(booking.lab);
            if (lab) {
                const workstation = lab.workstations.id(booking.workstation.workstationId);
                if (workstation) {
                    workstation.status = 'available';
                    await lab.save();
                }
            }
        }

        // Notify user about booking status change
        const statusMessages = {
            confirmed: 'Your booking has been confirmed.',
            cancelled: 'Your booking has been cancelled.',
            completed: 'Your booking has been marked as completed.',
            'no-show': 'Your booking was marked as no-show.'
        };

        if (statusMessages[status]) {
            await createNotification({
                recipient: booking.user._id,
                sender: req.user._id,
                type: status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
                title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                message: `Your booking for ${booking.lab?.name || 'a lab'} on ${new Date(booking.date).toLocaleDateString()} - ${statusMessages[status]}`,
                link: '/student/my-bookings',
                priority: status === 'cancelled' ? 'high' : 'medium',
                relatedModel: 'Booking',
                relatedId: booking._id
            });
        }

        res.json({ success: true, message: `Booking ${status} successfully`, booking });
    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PATCH /api/bookings/:id/checkin
// @desc    Check in to booking
// @access  Private
exports.checkin = async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user._id,
            status: 'confirmed'
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        booking.checkedInAt = new Date();
        await booking.save();

        res.json({ success: true, message: 'Checked in successfully' });
    } catch (error) {
        console.error('Checkin error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/bookings/conflicts
// @desc    Detect booking conflicts (admin only)
// @access  Admin/Superadmin
exports.detectConflicts = async (req, res) => {
    try {
        const { date, lab } = req.query;
        let query = {
            status: { $in: ['pending', 'confirmed'] }
        };

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }
        if (lab) query.lab = lab;

        const bookings = await Booking.find(query)
            .populate('user', 'name username email')
            .populate('lab', 'name code')
            .sort({ date: 1, startTime: 1 });

        // Group bookings by lab + workstation + date
        const grouped = {};
        bookings.forEach(booking => {
            const wsId = booking.workstation?.workstationId?.toString() || 'unknown';
            const labId = booking.lab?._id?.toString() || 'unknown';
            const dateKey = new Date(booking.date).toISOString().split('T')[0];
            const key = `${labId}-${wsId}-${dateKey}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(booking);
        });

        // Find conflicts
        const conflicts = [];
        Object.entries(grouped).forEach(([key, groupBookings]) => {
            if (groupBookings.length < 2) return;

            for (let i = 0; i < groupBookings.length; i++) {
                for (let j = i + 1; j < groupBookings.length; j++) {
                    const a = groupBookings[i];
                    const b = groupBookings[j];

                    // Check time overlap
                    if (a.startTime < b.endTime && b.startTime < a.endTime) {
                        conflicts.push({
                            booking1: {
                                id: a._id,
                                user: a.user,
                                startTime: a.startTime,
                                endTime: a.endTime,
                                purpose: a.purpose,
                                createdAt: a.createdAt
                            },
                            booking2: {
                                id: b._id,
                                user: b.user,
                                startTime: b.startTime,
                                endTime: b.endTime,
                                purpose: b.purpose,
                                createdAt: b.createdAt
                            },
                            lab: a.lab,
                            workstation: a.workstation,
                            date: a.date
                        });
                    }
                }
            }
        });

        res.json({
            success: true,
            conflicts,
            totalConflicts: conflicts.length
        });
    } catch (error) {
        console.error('Detect conflicts error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PATCH /api/bookings/:id/resolve-conflict
// @desc    Resolve a booking conflict (admin cancels one booking)
// @access  Admin/Superadmin
exports.resolveConflict = async (req, res) => {
    try {
        const { cancelBookingId } = req.body;

        if (!cancelBookingId) {
            return res.status(400).json({ success: false, message: 'Booking ID to cancel is required' });
        }

        const booking = await Booking.findById(cancelBookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancellationReason = 'Resolved by admin - conflict';
        await booking.save();

        // Update workstation status
        const lab = await Lab.findById(booking.lab);
        if (lab) {
            const workstation = lab.workstations.id(booking.workstation.workstationId);
            if (workstation) {
                workstation.status = 'available';
                await lab.save();
            }
        }

        res.json({ success: true, message: 'Conflict resolved - booking cancelled', booking });
    } catch (error) {
        console.error('Resolve conflict error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
