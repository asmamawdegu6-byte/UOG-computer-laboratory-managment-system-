const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const labRoutes = require('./routes/labs');
const bookingRoutes = require('./routes/bookings');
const reservationRoutes = require('./routes/reservations');
const maintenanceRoutes = require('./routes/maintenance');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/reports');
const materialRoutes = require('./routes/materials');
const attendanceRoutes = require('./routes/attendance');
const superadminRoutes = require('./routes/superadmin');
const notificationRoutes = require('./routes/notifications');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Request logging for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Database connection with MongoDB Memory Server for development
const startServer = async () => {
    let mongoUri;

    // Use configured MongoDB URI if provided, otherwise use memory server
    if (process.env.MONGODB_URI) {
        mongoUri = process.env.MONGODB_URI;
        console.log('Using configured MongoDB:', mongoUri);
    } else {
        // Use MongoDB Memory Server for development
        console.log('Starting MongoDB Memory Server...');
        const mongoServer = await MongoMemoryServer.create();
        mongoUri = mongoServer.getUri();
        console.log('MongoDB Memory Server started!');
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Auto-seed data if database is empty
        await seedData();
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// Seed data function
async function seedData() {
    const User = require('./models/User');
    const Lab = require('./models/Lab');
    const Reservation = require('./models/Reservation');
    const Attendance = require('./models/Attendance');

    try {
        // Check if users exist
        let admin, teacher;
        const existingAdmin = await User.findOne({ username: 'admin' });
        const existingTeacher = await User.findOne({ username: 'teacher' });

        if (!existingAdmin) {
            console.log('Seeding users...');
            admin = await User.create({
                username: 'admin',
                email: 'admin@clm.edu',
                password: 'Admin@123',
                firstName: 'System',
                lastName: 'Administrator',
                name: 'System Administrator',
                role: 'admin',
                isActive: true,
                approvalStatus: 'approved'
            });

            await User.create({
                username: 'superadmin',
                email: 'superadmin@clm.edu',
                password: 'Super@123',
                firstName: 'Super',
                lastName: 'Administrator',
                name: 'Super Administrator',
                role: 'superadmin',
                isActive: true,
                approvalStatus: 'approved'
            });

            teacher = await User.create({
                username: 'teacher',
                email: 'teacher@clm.edu',
                password: 'Teacher@123',
                firstName: 'Jane',
                lastName: 'Smith',
                name: 'Dr. Jane Smith',
                role: 'teacher',
                department: 'Computer Science',
                isActive: true,
                approvalStatus: 'approved'
            });

            await User.create({
                username: 'student',
                email: 'student@clm.edu',
                password: 'Student@123',
                firstName: 'John',
                lastName: 'Student',
                name: 'John Student',
                role: 'student',
                studentId: 'GUR/00001/20',
                year: 2,
                semester: 1,
                department: 'Computer Science',
                isActive: true,
                approvalStatus: 'approved'
            });

            await User.create({
                username: 'technician',
                email: 'tech@clm.edu',
                password: 'Tech@123',
                firstName: 'Tech',
                lastName: 'Mike',
                name: 'Tech Mike',
                role: 'technician',
                isActive: true,
                approvalStatus: 'approved'
            });
        } else {
            admin = existingAdmin;
            teacher = existingTeacher;
        }

        // Always ensure extra students exist
        const studentEmails = ['student2@clm.edu', 'student3@clm.edu', 'student4@clm.edu', 'student5@clm.edu'];
        const studentNames = ['Alice Johnson', 'Bob Williams', 'Carol Davis', 'David Brown'];
        const studentFirstNames = ['Alice', 'Bob', 'Carol', 'David'];
        const studentLastNames = ['Johnson', 'Williams', 'Davis', 'Brown'];
        const studentIds = ['GUR/00002/20', 'GUR/00003/20', 'GUR/00004/20', 'GUR/00005/20'];
        const students = [];

        for (let i = 0; i < studentEmails.length; i++) {
            let s = await User.findOne({ email: studentEmails[i] });
            if (!s) {
                s = await User.create({
                    username: studentEmails[i].split('@')[0],
                    email: studentEmails[i],
                    password: 'Student@123',
                    firstName: studentFirstNames[i],
                    lastName: studentLastNames[i],
                    name: studentNames[i],
                    role: 'student',
                    studentId: studentIds[i],
                    year: (i % 4) + 1,
                    semester: (i % 2) + 1,
                    department: i < 3 ? 'Computer Science' : 'Information Technology',
                    isActive: true,
                    approvalStatus: 'approved'
                });
            }
            students.push(s);
        }

        // Also get existing student
        const mainStudent = await User.findOne({ username: 'student' });
        if (mainStudent) students.unshift(mainStudent);

        // Always ensure labs exist
        let lab1 = await Lab.findOne({ code: 'LAB-A101' });
        if (!lab1) {
            lab1 = await Lab.create({
                name: 'Computer Lab A',
                code: 'LAB-A101',
                location: { building: 'Science Block', floor: '1st Floor', roomNumber: 'A101' },
                capacity: 30,
                facilities: ['projector', 'whiteboard', 'ac', 'internet'],
                openingHours: {
                    monday: { open: '08:00', close: '18:00' },
                    tuesday: { open: '08:00', close: '18:00' },
                    wednesday: { open: '08:00', close: '18:00' },
                    thursday: { open: '08:00', close: '18:00' },
                    friday: { open: '08:00', close: '17:00' },
                    saturday: { open: '09:00', close: '13:00' },
                    sunday: { open: 'closed', close: 'closed' }
                }
            });
        }

        let lab2 = await Lab.findOne({ code: 'LAB-B202' });
        if (!lab2) {
            lab2 = await Lab.create({
                name: 'Programming Lab B',
                code: 'LAB-B202',
                location: { building: 'Science Block', floor: '2nd Floor', roomNumber: 'B202' },
                capacity: 25,
                facilities: ['projector', 'whiteboard', 'ac', 'internet', 'printer'],
                openingHours: {
                    monday: { open: '08:00', close: '20:00' },
                    tuesday: { open: '08:00', close: '20:00' },
                    wednesday: { open: '08:00', close: '20:00' },
                    thursday: { open: '08:00', close: '20:00' },
                    friday: { open: '08:00', close: '18:00' },
                    saturday: { open: '09:00', close: '15:00' },
                    sunday: { open: 'closed', close: 'closed' }
                }
            });
        }

        // Always ensure reservations exist
        const reservationCount = await Reservation.countDocuments();
        if (reservationCount === 0 && teacher && admin) {
            console.log('Seeding reservations and attendance...');

            const today = new Date();
            const getMonday = () => {
                const d = new Date(today);
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                d.setDate(diff);
                d.setHours(0, 0, 0, 0);
                return d;
            };
            const monday = getMonday();

            // Monday - CS101
            const res1 = await Reservation.create({
                teacher: teacher._id,
                lab: lab1._id,
                courseName: 'CS101 - Introduction to Programming',
                courseCode: 'CS101',
                date: new Date(monday),
                startTime: '09:00',
                endTime: '11:00',
                numberOfStudents: 25,
                status: 'approved',
                approvedBy: admin._id,
                approvedAt: new Date()
            });

            // Tuesday - CS201 Lab
            const tuesday = new Date(monday);
            tuesday.setDate(monday.getDate() + 1);
            const res2 = await Reservation.create({
                teacher: teacher._id,
                lab: lab2._id,
                courseName: 'CS201 - Data Structures Lab',
                courseCode: 'CS201',
                date: tuesday,
                startTime: '14:00',
                endTime: '16:00',
                numberOfStudents: 20,
                status: 'approved',
                approvedBy: admin._id,
                approvedAt: new Date()
            });

            // Wednesday - CS301
            const wednesday = new Date(monday);
            wednesday.setDate(monday.getDate() + 2);
            await Reservation.create({
                teacher: teacher._id,
                lab: lab1._id,
                courseName: 'CS301 - Database Systems',
                courseCode: 'CS301',
                date: wednesday,
                startTime: '10:00',
                endTime: '12:00',
                numberOfStudents: 28,
                status: 'approved',
                approvedBy: admin._id,
                approvedAt: new Date()
            });

            // Thursday - CS101 Lab (pending)
            const thursday = new Date(monday);
            thursday.setDate(monday.getDate() + 3);
            await Reservation.create({
                teacher: teacher._id,
                lab: lab2._id,
                courseName: 'CS101 - Programming Lab',
                courseCode: 'CS101',
                date: thursday,
                startTime: '09:00',
                endTime: '11:00',
                numberOfStudents: 25,
                status: 'pending'
            });

            // Friday - CS401
            const friday = new Date(monday);
            friday.setDate(monday.getDate() + 4);
            await Reservation.create({
                teacher: teacher._id,
                lab: lab1._id,
                courseName: 'CS401 - Software Engineering',
                courseCode: 'CS401',
                date: friday,
                startTime: '13:00',
                endTime: '15:00',
                numberOfStudents: 22,
                status: 'approved',
                approvedBy: admin._id,
                approvedAt: new Date()
            });

            // Last week reservation
            const lastMonday = new Date(monday);
            lastMonday.setDate(monday.getDate() - 7);
            const res6 = await Reservation.create({
                teacher: teacher._id,
                lab: lab1._id,
                courseName: 'CS201 - Algorithms',
                courseCode: 'CS201',
                date: lastMonday,
                startTime: '09:00',
                endTime: '11:00',
                numberOfStudents: 24,
                status: 'completed',
                approvedBy: admin._id,
                approvedAt: new Date()
            });

            // Create attendance records
            const presentStudents = students.slice(0, 5);
            for (const student of presentStudents) {
                const statuses = ['present', 'present', 'present', 'late', 'absent'];
                const idx = presentStudents.indexOf(student);
                await Attendance.create({
                    reservation: res1._id,
                    student: student._id,
                    status: statuses[idx],
                    markedBy: teacher._id,
                    checkInTime: ['present', 'late'].includes(statuses[idx]) ? new Date() : null
                });
            }

            for (const student of presentStudents) {
                const statuses = ['present', 'present', 'absent', 'present', 'excused'];
                const idx = presentStudents.indexOf(student);
                await Attendance.create({
                    reservation: res2._id,
                    student: student._id,
                    status: statuses[idx],
                    markedBy: teacher._id,
                    checkInTime: statuses[idx] === 'present' ? new Date() : null
                });
            }

            for (const student of presentStudents) {
                await Attendance.create({
                    reservation: res6._id,
                    student: student._id,
                    status: 'present',
                    markedBy: teacher._id,
                    checkInTime: new Date()
                });
            }

            console.log('Reservations and attendance seeded!');
        }

        console.log('Seed data ready!');
        console.log('Login: admin / admin123');
    } catch (error) {
        console.error('Seed error:', error);
    }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

startServer().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
});

module.exports = app;
