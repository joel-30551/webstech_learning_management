import { Router } from 'express';
import { protect, adminOnly, restrictTo } from '../middleware/auth';
import {
  getTeachers,
  getTeacherProfileMe,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from '../controllers/teacher.controller';

const router = Router();

router.get('/me', protect, restrictTo('teacher'), getTeacherProfileMe);

router.get('/', protect, adminOnly, getTeachers);
router.get('/:id', protect, adminOnly, getTeacherById);
router.post('/', protect, adminOnly, createTeacher);
router.put('/:id', protect, adminOnly, updateTeacher);
router.delete('/:id', protect, adminOnly, deleteTeacher);

export default router;
