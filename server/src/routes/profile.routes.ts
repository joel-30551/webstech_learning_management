import { Router } from 'express';
import { changePassword } from '../controllers/profile.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/change-password', protect, changePassword);

export default router;
