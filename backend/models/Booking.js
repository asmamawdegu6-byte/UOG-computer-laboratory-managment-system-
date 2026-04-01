const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lab: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lab',
        required: true
    },
    workstation: {
        workstationId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        workstationNumber: {
            type: String,
            required: true
        }
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },
    endTime: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },
    purpose: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
        default: 'pending'
    },
    checkedInAt: {
        type: Date
    },
    checkedOutAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    cancellationReason: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
bookingSchema.index({ user: 1, date: -1 });
bookingSchema.index({ lab: 1, date: 1 });
bookingSchema.index({ status: 1 });

// Check for overlapping bookings
bookingSchema.statics.checkOverlap = async function (labId, workstationId, date, startTime, endTime, excludeBookingId = null) {
    const query = {
        lab: labId,
        'workstation.workstationId': workstationId,
        date: new Date(date),
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
        ]
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    return this.findOne(query);
};

module.exports = mongoose.model('Booking', bookingSchema);
