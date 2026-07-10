import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import teacherRoutes from './routes/teacher.routes';
import studentRoutes from './routes/student.routes';
import userAccountsRoutes from './routes/user-accounts.routes';
import accountantRoutes from './routes/accountant.routes';
import announcementRoutes from './routes/announcement.routes';
import feeRoutes from './routes/fee.routes';
import materialRoutes from './routes/learningmaterial.routes';
import timetableRoutes from './routes/timetable.routes';
import profileRoutes from './routes/profile.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/user-accounts', userAccountsRoutes);
app.use('/api/accountants', accountantRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/status', (_req: express.Request, res: express.Response) => {
  res.json({ message: 'Backend is running.' });
});

export default app;

