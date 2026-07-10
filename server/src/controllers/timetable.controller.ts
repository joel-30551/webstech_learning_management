import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import streamifier from 'streamifier';
import Timetable from '../models/Timetable.model';

// POST /api/timetables  (multipart/form-data, field name: "file")
export const uploadTimetable = async (req: Request, res: Response) => {
  try {
    const { title, term, stream, academicYear } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!title || !term || !stream || !academicYear) {
      return res.status(400).json({ message: 'title, term, stream and academicYear are required' });
    }

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'timetables',
          resource_type: 'auto',
          public_id: `${stream}-${term}-${academicYear}-${Date.now()}`.replace(/\s+/g, '_'),
        },
        (error: any, result: any) => (error ? reject(error) : resolve(result))

      );
      streamifier.createReadStream(req.file!.buffer).pipe(uploadStream);
    });

    const timetable = await Timetable.create({
      title,
      term,
      stream,
      academicYear,
      fileUrl: uploadResult.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      cloudinaryPublicId: uploadResult.public_id,
      uploadedBy: (req as any).user?._id,
    });

    return res.status(201).json(timetable);
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to upload timetable', error: err.message });
  }
};

// GET /api/timetables?term=&stream=&academicYear=
export const getTimetables = async (req: Request, res: Response) => {
  try {
    const { term, stream, academicYear } = req.query;
    const filter: Record<string, unknown> = {};
    if (term) filter.term = term;
    if (stream) filter.stream = stream;
    if (academicYear) filter.academicYear = academicYear;

    const timetables = await Timetable.find(filter).sort({ createdAt: -1 });
    return res.json(timetables);
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to fetch timetables', error: err.message });
  }
};

// GET /api/timetables/:id
export const getTimetableById = async (req: Request, res: Response) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
    return res.json(timetable);
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to fetch timetable', error: err.message });
  }
};

// DELETE /api/timetables/:id
export const deleteTimetable = async (req: Request, res: Response) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });

    await cloudinary.uploader.destroy(timetable.cloudinaryPublicId, { resource_type: 'auto' });
    await timetable.deleteOne();

    return res.json({ message: 'Timetable deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to delete timetable', error: err.message });
  }
};