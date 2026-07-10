import { Router } from 'express';
import multer from 'multer';
import { protect, adminOnly } from '../middleware/auth';
import {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '../controllers/material.controller';

const router = Router();

// Use memory storage so the buffer is available for Cloudinary streaming
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', protect, getMaterials);
router.get('/:id', protect, getMaterialById);
router.post('/', protect, adminOnly, upload.single('file'), createMaterial);
router.put('/:id', protect, adminOnly, upload.single('file'), updateMaterial);
router.delete('/:id', protect, adminOnly, deleteMaterial);

export default router;
