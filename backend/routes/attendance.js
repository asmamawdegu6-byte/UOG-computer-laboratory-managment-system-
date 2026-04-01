const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array().map(e => e.msg) });
    }
    next();
};

router.get('/reservation/:reservationId', authenticate, authorize('teacher', 'admin', 'superadmin'), attendanceController.getAttendance);

// Public routes for QR attendance scan
router.get('/session/:reservationId', attendanceController.getSessionInfo);
router.post('/qr-scan', [
    body('reservationId').notEmpty(),
    body('studentId').trim().notEmpty().withMessage('Student ID is required'),
    validate
], attendanceController.markAttendanceByQR);

router.post('/mark', authenticate, authorize('teacher', 'admin', 'superadmin'), [
    body('reservationId').notEmpty(),
    body('studentId').notEmpty(),
    body('status').isIn(['present', 'absent', 'late', 'excused']),
    validate
], attendanceController.markAttendance);

router.post('/bulk-mark', authenticate, authorize('teacher', 'admin', 'superadmin'), [
    body('reservationId').notEmpty(),
    body('attendanceRecords').isArray({ min: 1 }),
    body('attendanceRecords.*.studentId').notEmpty(),
    body('attendanceRecords.*.status').isIn(['present', 'absent', 'late', 'excused']),
    validate
], attendanceController.bulkMarkAttendance);

router.get('/stats/:reservationId', authenticate, authorize('teacher', 'admin', 'superadmin'), attendanceController.getAttendanceStats);

router.post('/checkout', authenticate, authorize('teacher', 'admin', 'superadmin'), [
    body('reservationId').notEmpty(),
    body('studentId').trim().notEmpty().withMessage('Student ID is required'),
    validate
], attendanceController.checkOutStudent);

router.post('/mark-by-student-id', authenticate, authorize('teacher', 'admin', 'superadmin'), [
    body('reservationId').notEmpty(),
    body('studentId').trim().notEmpty().withMessage('Student ID is required'),
    body('status').optional().isIn(['present', 'absent', 'late', 'excused']),
    validate
], attendanceController.markByStudentId);

router.post('/mark-by-email', authenticate, authorize('teacher', 'admin', 'superadmin'), [
    body('reservationId').notEmpty(),
    body('email').trim().notEmpty().withMessage('Student ID or email is required'),
    validate
], attendanceController.markAttendanceByEmail);

// Student self-service attendance (no QR, just Student ID)
router.get('/active-session', authenticate, attendanceController.getActiveSession);
router.post('/mark-student', authenticate, [
    body('studentId').trim().notEmpty().withMessage('Student ID is required'),
    validate
], attendanceController.markStudentAttendance);

module.exports = router;
