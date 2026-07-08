import { Router } from 'express';
import multer from 'multer';
import { protect, adminOnly } from '../middleware/auth';
import {
  uploadTimetable,
  getTimetables,
  getTimetableById,
  deleteTimetable,
} from '../controllers/timetable.controller';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.get('/', protect, getTimetables);
router.get('/:id', protect, getTimetableById);
router.post('/', protect, adminOnly, upload.single('file'), uploadTimetable);
router.delete('/:id', protect, adminOnly, deleteTimetable);

export default router;