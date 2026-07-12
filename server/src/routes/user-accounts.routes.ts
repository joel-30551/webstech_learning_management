import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth';
import {
  getUserAccounts,
  createUserAccount,
  updateUserAccount,
  deleteUserAccount,
  updateUserAccountStatus,
} from '../controllers/user-accounts.controller';

const router = Router();

router.get('/', protect, adminOnly, getUserAccounts);
router.post('/', protect, adminOnly, createUserAccount);
router.put('/:id', protect, adminOnly, updateUserAccount);
router.delete('/:id', protect, adminOnly, deleteUserAccount);
router.patch('/:id/status', protect, adminOnly, updateUserAccountStatus);

export default router;
