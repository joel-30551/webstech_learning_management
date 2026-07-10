import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import streamifier from 'streamifier';
import Material from '../models/Material.model';

// GET all learning materials
export const getMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, subject, classLevel } = req.query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (subject) filter.subject = subject;
    if (classLevel) filter.classLevel = classLevel;
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { subject:     { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const materials = await Material.find(filter).sort({ createdAt: -1 });
    res.json(materials);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching materials.' });
  }
};

// GET single learning material
export const getMaterialById = async (req: Request, res: Response): Promise<void> => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      res.status(404).json({ message: 'Material not found.' });
      return;
    }
    // Increment accessCount if accessed via API for view/download
    material.accessCount = (material.accessCount || 0) + 1;
    await material.save();

    res.json(material);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching material.' });
  }
};

// POST upload new learning material
export const createMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, subject, classLevel, description } = req.body;

    if (!title || !subject || !classLevel) {
      res.status(400).json({ message: 'Title, subject, and class level are required.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'Please upload a PDF file.' });
      return;
    }

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'learning-materials',
          resource_type: 'auto',
          public_id: `material-${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${Date.now()}`,
        },
        (error: any, result: any) => (error ? reject(error) : resolve(result))
      );
      streamifier.createReadStream(req.file!.buffer).pipe(uploadStream);
    });

    const material = await Material.create({
      title,
      subject,
      classLevel,
      description: description || '',
      fileUrl: uploadResult.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedBy: (req as any).user?.username || 'admin',
    });

    res.status(201).json(material);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error uploading material.' });
  }
};

// PUT update learning material details (does not change PDF file itself)
export const updateMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      res.status(404).json({ message: 'Material not found.' });
      return;
    }

    const { title, subject, classLevel, description } = req.body;
    if (title) material.title = title;
    if (subject) material.subject = subject;
    if (classLevel) material.classLevel = classLevel;
    if (description !== undefined) material.description = description;

    // Handle file replacement if a new file is sent
    if (req.file) {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'learning-materials',
            resource_type: 'auto',
            public_id: `material-${(title || material.title).toLowerCase().replace(/[^a-z0-9]/g, '_')}-${Date.now()}`,
          },
          (error: any, result: any) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(req.file!.buffer).pipe(uploadStream);
      });

      material.fileUrl = uploadResult.secure_url;
      material.fileName = req.file.originalname;
      material.fileSize = req.file.size;
    }

    await material.save();
    res.json(material);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating material.' });
  }
};

// DELETE learning material
export const deleteMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      res.status(404).json({ message: 'Material not found.' });
      return;
    }

    // Since we don't store cloudinaryPublicId in Schema directly, 
    // we can parse it from fileUrl if it is a Cloudinary URL,
    // or just bypass if it's the mock PDF dummy.
    if (material.fileUrl && material.fileUrl.includes('cloudinary.com')) {
      const parts = material.fileUrl.split('/');
      const filenameWithExtension = parts[parts.length - 1];
      const publicId = filenameWithExtension.split('.')[0];
      await cloudinary.uploader.destroy(`learning-materials/${publicId}`, { resource_type: 'auto' });
    }

    await material.deleteOne();
    res.json({ message: 'Material deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error deleting material.' });
  }
};
