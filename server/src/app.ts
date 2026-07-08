import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import teacherRoutes from './routes/teacher.routes';
import studentRoutes from './routes/student.routes';
import userAccountsRoutes from './routes/user-accounts.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/user-accounts', userAccountsRoutes);

// Health check
app.get('/api/status', (_req: express.Request, res: express.Response) => {
  res.json({ message: 'Backend is running.' });
});

export default app;
