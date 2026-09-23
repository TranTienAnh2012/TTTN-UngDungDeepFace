const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const structureRoutes = require('./routes/structure.routes');
const userRoutes = require('./routes/admin/user.routes');
const courseRoutes = require('./routes/admin/course.routes');
const studentRoutes = require('./routes/admin/student.routes');
const classRoutes = require('./routes/admin/class.routes');
const examRoutes = require('./routes/admin/exam.routes');
const dashboardRoutes = require('./routes/admin/dashboard.routes');
const roomRoutes = require('./routes/room.routes');
const shiftRoutes = require('./routes/shift.routes');
const facultyRoutes = require('./routes/faculty.routes');
const academicClassRoutes = require('./routes/academic_class.routes');
const teacherScheduleRoutes = require('./routes/teacher/schedule.routes');
const errorMiddleware = require('./middleware/error.middleware');

dotenv.config({ override: false });

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        message: "Quá nhiều request. Vui lòng thử lại sau.",
    },
});

// Auth Routes
app.use('/api/auth', authLimiter, authRoutes);

// Chat & Structure Routes
app.use('/api/chat', chatRoutes);
app.use('/api/structure', structureRoutes);

// Teacher & General API Routes
app.use('/api', apiRoutes);
app.use('/api/teacher', apiRoutes);

// Admin Routes (Direct & Legacy Aliases)
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/courses', courseRoutes);
app.use('/api/admin/students', studentRoutes);
app.use('/api/admin/classes', classRoutes);
app.use('/api/admin/exams', examRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/rooms', roomRoutes);

app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/academic-classes', academicClassRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/schedules', teacherScheduleRoutes);
app.use('/api/teacher/schedules', teacherScheduleRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorMiddleware);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'Backend API Gateway' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
