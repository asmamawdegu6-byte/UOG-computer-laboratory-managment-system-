const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    reservation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused'],
        default: 'absent'
    },
    checkInTime: {
        type: Date
    },
    checkOutTime: {
        type: Date
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Compound index to ensure one attendance record per student per reservation
attendanceSchema.index({ reservation: 1, student: 1 }, { unique: true });
attendanceSchema.index({ reservation: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
