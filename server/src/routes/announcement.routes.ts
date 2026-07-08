import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcement.controller';

const router = Router();

router.get('/', protect, getAnnouncements);
router.get('/:id', protect, getAnnouncementById);
router.post('/', protect, adminOnly, createAnnouncement);
router.put('/:id', protect, adminOnly, updateAnnouncement);
router.delete('/:id', protect, adminOnly, deleteAnnouncement);

export default router;
