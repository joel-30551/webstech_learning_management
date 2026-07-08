import { Router } from 'express';
import { protect, adminOnly, restrictTo } from '../middleware/auth';
import {
  getAccountant,
  getAccountantProfileMe,
  getAccountantById,
  createAccountant,
  updateAccountant,
  deleteAccountant,
} from '../controllers/accountant.controller';

const router = Router();

// /me endpoint must be placed before /:id endpoint to avoid matching "me" as an id param
router.get('/me', protect, restrictTo('accountant'), getAccountantProfileMe);

router.get('/', protect, adminOnly, getAccountant);
router.get('/:id', protect, adminOnly, getAccountantById);
router.post('/', protect, adminOnly, createAccountant);
router.put('/:id', protect, adminOnly, updateAccountant);
router.delete('/:id', protect, adminOnly, deleteAccountant);

export default router;
