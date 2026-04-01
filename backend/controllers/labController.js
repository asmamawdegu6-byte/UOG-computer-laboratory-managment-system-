const Lab = require('../models/Lab');
const Booking = require('../models/Booking');

// @route   GET /api/labs
// @desc    Get all labs
// @access  Public
exports.getAllLabs = async (req, res) => {
    try {
        const { status, search, campus, page = 1, limit = 20, all } = req.query;

        const currentPage = parseInt(page) || 1;
        const currentLimit = parseInt(limit) || 20;
        const skip = (currentPage - 1) * currentLimit;

        let query = {};

        // Default to active only, unless 'all' is requested (intended for admin management)
        if (all !== 'true') {
            query.isActive = true;
        }

        if (status) query.status = status;
        if (campus) query.campus = campus;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { campus: { $regex: search, $options: 'i' } },
                { 'location.building': { $regex: search, $options: 'i' } },
                { 'location.floor': { $regex: search, $options: 'i' } },
                { 'location.roomNumber': { $regex: search, $options: 'i' } },
                { facilities: { $in: [new RegExp(search, 'i')] } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const labs = await Lab.find(query)
            .populate('supervisor', 'name email')
            .skip(skip)
            .limit(currentLimit)
            .sort({ name: 1 });

        const total = await Lab.countDocuments(query);

        res.json({
            success: true,
            labs,
            pagination: {
                page: currentPage,
                limit: currentLimit,
                total,
                pages: Math.ceil(total / currentLimit)
            }
        });
    } catch (error) {
        console.error('Get labs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/labs/:id
// @desc    Get lab by ID
// @access  Public
exports.getLabById = async (req, res) => {
    try {
        const lab = await Lab.findById(req.params.id).populate('supervisor', 'name email');
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }
        res.json({ success: true, lab });
    } catch (error) {
        console.error('Get lab error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/labs/:id/workstations
// @desc    Get workstations for a lab
// @access  Public
exports.getWorkstations = async (req, res) => {
    try {
        const lab = await Lab.findById(req.params.id);
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }
        res.json({ success: true, workstations: lab.workstations });
    } catch (error) {
        console.error('Get workstations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/labs/:id/availability
// @desc    Get workstation availability for a date
// @access  Public
exports.getAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }

        const lab = await Lab.findById(req.params.id);
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const bookings = await Booking.find({
            lab: req.params.id,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['pending', 'confirmed'] }
        });

        const availability = lab.workstations.map(ws => {
            const workstationBookings = bookings.filter(
                b => b.workstation.workstationId.toString() === ws._id.toString()
            );
            return {
                ...ws.toObject(),
                bookings: workstationBookings.map(b => ({
                    startTime: b.startTime,
                    endTime: b.endTime,
                    status: b.status
                }))
            };
        });

        res.json({ success: true, date: new Date(date), availability });
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   POST /api/labs
// @desc    Create new lab (admin only)
// @access  Admin/Superadmin
exports.createLab = async (req, res) => {
    try {
        const lab = new Lab(req.body);
        await lab.save();
        res.status(201).json({ success: true, message: 'Lab created successfully', lab });
    } catch (error) {
        console.error('Create lab error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PUT /api/labs/:id
// @desc    Update lab (admin only)
// @access  Admin/Superadmin
exports.updateLab = async (req, res) => {
    try {
        const lab = await Lab.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('supervisor', 'name email');
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }
        res.json({ success: true, message: 'Lab updated successfully', lab });
    } catch (error) {
        console.error('Update lab error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   DELETE /api/labs/:id
// @desc    Delete lab (admin only)
// @access  Admin/Superadmin
exports.deleteLab = async (req, res) => {
    try {
        const lab = await Lab.findById(req.params.id);
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }
        lab.isActive = false;
        await lab.save();
        res.json({ success: true, message: 'Lab deactivated successfully' });
    } catch (error) {
        console.error('Delete lab error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
