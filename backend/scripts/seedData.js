/**
 * Seed script to populate database with initial data
 * Run with: node scripts/seedData.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Lab = require('../models/Lab');
const Equipment = require('../models/Equipment');
const Reservation = require('../models/Reservation');
const Attendance = require('../models/Attendance');
const Campus = require('../models/Campus');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clm_system';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Seed data
const seedData = async () => {
    try {
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Lab.deleteMany({});
        await Equipment.deleteMany({});
        await Reservation.deleteMany({});
        await Attendance.deleteMany({});
        await Campus.deleteMany({});

        // Create campuses
        console.log('Creating campuses...');
        const campus1 = await Campus.create({
            name: 'Maraki',
            code: 'MKR',
            city: 'Gondar',
            address: 'Maraki Campus, University of Gondar',
            contactEmail: 'maraki@uog.edu.et',
            contactPhone: '+251-581-110001',
            description: 'Main campus of University of Gondar',
            isActive: true
        });

        const campus2 = await Campus.create({
            name: 'Atse Tewodros',
            code: 'ATC',
            city: 'Gondar',
            address: 'Atse Tewodros Campus, University of Gondar',
            contactEmail: 'atse.tewodros@uog.edu.et',
            contactPhone: '+251-581-110002',
            description: 'Atse Tewodros campus of University of Gondar',
            isActive: true
        });

        const campus3 = await Campus.create({
            name: 'Atse Fasil',
            code: 'AFS',
            city: 'Gondar',
            address: 'Atse Fasil Campus, University of Gondar',
            contactEmail: 'atse.fasil@uog.edu.et',
            contactPhone: '+251-581-110003',
            description: 'Atse Fasil campus of University of Gondar',
            isActive: true
        });

        const campus4 = await Campus.create({
            name: 'Health Science College (GC)',
            code: 'HSC',
            city: 'Gondar',
            address: 'Health Science College, University of Gondar',
            contactEmail: 'hsc@uog.edu.et',
            contactPhone: '+251-581-110004',
            description: 'Health Science College campus of University of Gondar',
            isActive: true
        });
        console.log('Created 4 campuses: Maraki, Atse Tewodros, Atse Fasil, Health Science College (GC)');

        console.log('Creating users...');

        // Create admin user
        const admin = await User.create({
            username: 'admin',
            email: 'admin@clm.edu',
            password: 'admin123',
            name: 'System Administrator',
            role: 'admin'
        });
        console.log('Created admin:', admin.username);

        // Create superadmin user
        await User.create({
            username: 'superadmin',
            email: 'superadmin@clm.edu',
            password: 'superadmin123',
            name: 'Super Administrator',
            role: 'superadmin'
        });
        console.log('Created superadmin');

        // Create teacher users
        const teacher1 = await User.create({
            username: 'teacher',
            email: 'teacher@clm.edu',
            password: 'teacher123',
            name: 'Dr. Jane Smith',
            role: 'teacher',
            department: 'Computer Science'
        });
        console.log('Created teacher:', teacher1.username);

        // Create student users
        const student1 = await User.create({
            username: 'student',
            email: 'student@clm.edu',
            password: 'student123',
            name: 'John Student',
            role: 'student',
            studentId: 'STU001',
            department: 'Computer Science'
        });

        const student2 = await User.create({
            username: 'student2',
            email: 'student2@clm.edu',
            password: 'student123',
            name: 'Alice Johnson',
            role: 'student',
            studentId: 'STU002',
            department: 'Computer Science'
        });

        const student3 = await User.create({
            username: 'student3',
            email: 'student3@clm.edu',
            password: 'student123',
            name: 'Bob Williams',
            role: 'student',
            studentId: 'STU003',
            department: 'Computer Science'
        });

        const student4 = await User.create({
            username: 'student4',
            email: 'student4@clm.edu',
            password: 'student123',
            name: 'Carol Davis',
            role: 'student',
            studentId: 'STU004',
            department: 'Information Technology'
        });

        const student5 = await User.create({
            username: 'student5',
            email: 'student5@clm.edu',
            password: 'student123',
            name: 'David Brown',
            role: 'student',
            studentId: 'STU005',
            department: 'Computer Science'
        });
        console.log('Created 5 students');

        // Create technician user
        await User.create({
            username: 'technician',
            email: 'tech@clm.edu',
            password: 'tech123',
            name: 'Tech Mike',
            role: 'technician'
        });
        console.log('Created technician');

        console.log('Creating labs...');

        // Create labs
        const lab1 = await Lab.create({
            name: 'Computer Lab A',
            code: 'LAB-A101',
            location: {
                building: 'Science Block',
                floor: '1st Floor',
                roomNumber: 'A101'
            },
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
            },
            description: 'General purpose computer lab with high-performance workstations',
            supervisor: teacher1._id
        });
        console.log('Created lab:', lab1.name);

        const lab2 = await Lab.create({
            name: 'Programming Lab B',
            code: 'LAB-B202',
            location: {
                building: 'Science Block',
                floor: '2nd Floor',
                roomNumber: 'B202'
            },
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
            },
            description: 'Dedicated lab for programming courses and software development',
            supervisor: teacher1._id
        });
        console.log('Created lab:', lab2.name);

        // Create sample reservations
        console.log('Creating reservations...');
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
        const students = [student1, student2, student3, student4, student5];

        // Monday - CS101
        const res1 = await Reservation.create({
            teacher: teacher1._id, lab: lab1._id,
            courseName: 'CS101 - Introduction to Programming', courseCode: 'CS101',
            date: new Date(monday), startTime: '09:00', endTime: '11:00',
            numberOfStudents: 25, status: 'approved', approvedBy: admin._id, approvedAt: new Date()
        });

        // Tuesday - CS201 Lab
        const tuesday = new Date(monday); tuesday.setDate(monday.getDate() + 1);
        const res2 = await Reservation.create({
            teacher: teacher1._id, lab: lab2._id,
            courseName: 'CS201 - Data Structures Lab', courseCode: 'CS201',
            date: tuesday, startTime: '14:00', endTime: '16:00',
            numberOfStudents: 20, status: 'approved', approvedBy: admin._id, approvedAt: new Date()
        });

        // Wednesday - CS301
        const wednesday = new Date(monday); wednesday.setDate(monday.getDate() + 2);
        const res3 = await Reservation.create({
            teacher: teacher1._id, lab: lab1._id,
            courseName: 'CS301 - Database Systems', courseCode: 'CS301',
            date: wednesday, startTime: '10:00', endTime: '12:00',
            numberOfStudents: 28, status: 'approved', approvedBy: admin._id, approvedAt: new Date()
        });

        // Thursday - CS101 Lab (pending)
        const thursday = new Date(monday); thursday.setDate(monday.getDate() + 3);
        await Reservation.create({
            teacher: teacher1._id, lab: lab2._id,
            courseName: 'CS101 - Programming Lab', courseCode: 'CS101',
            date: thursday, startTime: '09:00', endTime: '11:00',
            numberOfStudents: 25, status: 'pending'
        });

        // Friday - CS401
        const friday = new Date(monday); friday.setDate(monday.getDate() + 4);
        await Reservation.create({
            teacher: teacher1._id, lab: lab1._id,
            courseName: 'CS401 - Software Engineering', courseCode: 'CS401',
            date: friday, startTime: '13:00', endTime: '15:00',
            numberOfStudents: 22, status: 'approved', approvedBy: admin._id, approvedAt: new Date()
        });

        // Last week reservation
        const lastMonday = new Date(monday); lastMonday.setDate(monday.getDate() - 7);
        const res6 = await Reservation.create({
            teacher: teacher1._id, lab: lab1._id,
            courseName: 'CS201 - Algorithms', courseCode: 'CS201',
            date: lastMonday, startTime: '09:00', endTime: '11:00',
            numberOfStudents: 24, status: 'completed', approvedBy: admin._id, approvedAt: new Date()
        });
        console.log('Created 6 reservations');

        // Create attendance records
        console.log('Creating attendance records...');
        for (const student of students) {
            const statuses = ['present', 'present', 'present', 'late', 'absent'];
            const idx = students.indexOf(student);
            await Attendance.create({
                reservation: res1._id, student: student._id,
                status: statuses[idx], markedBy: teacher1._id,
                checkInTime: ['present', 'late'].includes(statuses[idx]) ? new Date() : null
            });
        }

        for (const student of students) {
            const statuses = ['present', 'present', 'absent', 'present', 'excused'];
            const idx = students.indexOf(student);
            await Attendance.create({
                reservation: res2._id, student: student._id,
                status: statuses[idx], markedBy: teacher1._id,
                checkInTime: statuses[idx] === 'present' ? new Date() : null
            });
        }

        for (const student of students) {
            await Attendance.create({
                reservation: res6._id, student: student._id,
                status: 'present', markedBy: teacher1._id, checkInTime: new Date()
            });
        }
        console.log('Created attendance records');

        console.log('\n========================================');
        console.log('Seed data created successfully!');
        console.log('========================================');
        console.log('\nDefault Login Credentials:');
        console.log('  Admin:       admin / admin123');
        console.log('  Superadmin:  superadmin / superadmin123');
        console.log('  Teacher:     teacher / teacher123');
        console.log('  Student:     student / student123');
        console.log('  Technician:  technician / tech123');
        console.log('\nCreated Campuses:');
        console.log(`  - ${campus1.name} (${campus1.code})`);
        console.log(`  - ${campus2.name} (${campus2.code})`);
        console.log(`  - ${campus3.name} (${campus3.code})`);
        console.log(`  - ${campus4.name} (${campus4.code})`);
        console.log('\nCreated Labs:');
        console.log(`  - ${lab1.name} (${lab1.code}) - ${lab1.capacity} workstations`);
        console.log(`  - ${lab2.name} (${lab2.code}) - ${lab2.capacity} workstations`);
        console.log('\nCreated: 6 reservations, 15 attendance records');
        console.log('========================================\n');

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

// Run seed
seedData();
