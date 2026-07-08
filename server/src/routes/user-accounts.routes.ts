import { Router } from 'express';
import {
  getUserAccounts,
  createUserAccount,
  updateUserAccount,
  deleteUserAccount,
  updateUserAccountStatus,
} from '../controllers/user-accounts.controller';

const router = Router();

router.get('/', getUserAccounts);
router.post('/', createUserAccount);
router.put('/:id', updateUserAccount);
router.delete('/:id', deleteUserAccount);
router.patch('/:id/status', updateUserAccountStatus);

export default router;
