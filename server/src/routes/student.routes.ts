import { Router } from 'express';
import { protect, adminOnly, restrictTo } from '../middleware/auth';
import {
  getStudents,
  getStudentProfileMe,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/student.controller';

const router = Router();

router.get('/me', protect, restrictTo('student'), getStudentProfileMe);

router.get('/', protect, adminOnly, getStudents);
router.get('/:id', protect, adminOnly, getStudentById);
router.post('/', protect, adminOnly, createStudent);
router.put('/:id', protect, adminOnly, updateStudent);
router.delete('/:id', protect, adminOnly, deleteStudent);

export default router;
