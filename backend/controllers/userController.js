const User = require('../models/User');

// @route   POST /api/users
// @desc    Create a new user (admin only)
// @access  Admin/Superadmin
exports.createUser = async (req, res) => {
    try {
        const { username, email, password, name, role, department, studentId, phone, campus, college } = req.body;

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email or username already exists' });
        }

        const user = await User.create({
            username,
            email,
            password,
            name,
            role: role || 'student',
            department,
            studentId,
            phone,
            campus,
            college,
            isActive: true,
            approvalStatus: 'approved'
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Admin/Superadmin
exports.getAllUsers = async (req, res) => {
    try {
        const { role, search, approvalStatus, page = 1, limit = 20 } = req.query;

        const currentPage = parseInt(page) || 1;
        const currentLimit = parseInt(limit) || 20;

        let query = {};

        if (role) query.role = role;
        if (approvalStatus) query.approvalStatus = approvalStatus;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { campus: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (currentPage - 1) * currentLimit;

        const users = await User.find(query)
            .select('-password')
            .skip(skip)
            .limit(currentLimit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            users,
            pagination: {
                page: currentPage,
                limit: currentLimit,
                total,
                pages: Math.ceil(total / currentLimit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
exports.getUserById = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin' &&
            req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
exports.updateUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin' &&
            req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { name, email, phone, department, studentId, campus, college } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (department) user.department = department;
        if (campus) user.campus = campus;
        if (college) user.college = college;
        if (studentId && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
            user.studentId = studentId;
        }

        await user.save();

        res.json({
            success: true,
            message: 'User updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PUT /api/users/:id/role
// @desc    Update user role (admin only)
// @access  Admin/Superadmin
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'superadmin') {
            return res.status(403).json({ success: false, message: 'Cannot modify superadmin' });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: 'User role updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PUT /api/users/:id/approve
// @desc    Approve a pending user (admin only)
// @access  Admin/Superadmin
exports.approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.approvalStatus = 'approved';
        user.isActive = true;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.name} has been approved`,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PUT /api/users/:id/reject
// @desc    Reject a pending user (admin only)
// @access  Admin/Superadmin
exports.rejectUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.approvalStatus = 'rejected';
        user.isActive = false;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.name} has been rejected`,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PUT /api/users/:id/reset-password
// @desc    Reset user password (admin only)
// @access  Admin/Superadmin
exports.resetUserPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Cannot reset superadmin password' });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: `Password for ${user.name} has been reset successfully`
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Admin/Superadmin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'superadmin') {
            return res.status(403).json({ success: false, message: 'Cannot delete superadmin' });
        }

        user.isActive = false;
        await user.save();

        res.json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
