import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth';
import {
  createFee,
  getFees,
  getFeeById,
  updateFee,
  deleteFee,
  getFeeSummary,
} from '../controllers/fee.controller';

const router = Router();

router.get('/summary', protect, getFeeSummary);
router.get('/', protect, getFees);
router.get('/:id', protect, getFeeById);
router.post('/', protect, adminOnly, createFee);
router.put('/:id', protect, adminOnly, updateFee);
router.delete('/:id', protect, adminOnly, deleteFee);

export default router;