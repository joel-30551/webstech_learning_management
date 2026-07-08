import { Request, Response } from 'express';
import Announcement from '../models/Announcement.model';

// GET all announcements
export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, priority, status } = req.query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title:   { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { postedBy:{ $regex: search, $options: 'i' } },
      ];
    }

    const announcements = await Announcement.find(filter).sort({ pinned: -1, postedAt: -1 });
    res.json(announcements);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching announcements.' });
  }
};

// GET single announcement
export const getAnnouncementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      res.status(404).json({ message: 'Announcement not found.' });
      return;
    }
    res.json(announcement);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching announcement.' });
  }
};

// POST create announcement
export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, message, targetAudience, targetStreams, priority, pinned, expiresAt } = req.body;
    if (!title || !message) {
      res.status(400).json({ message: 'Title and message are required.' });
      return;
    }

    const newAnnouncement = new Announcement({
      title,
      message,
      targetAudience: targetAudience || 'all',
      targetStreams: targetStreams || [],
      priority: priority || 'normal',
      pinned: pinned || false,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      postedBy: (req as any).user?.username || 'admin',
    });

    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating announcement.' });
  }
};

// PUT update announcement
export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!announcement) {
      res.status(404).json({ message: 'Announcement not found.' });
      return;
    }
    res.json(announcement);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating announcement.' });
  }
};

// DELETE announcement
export const deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      res.status(404).json({ message: 'Announcement not found.' });
      return;
    }
    res.json({ message: 'Announcement deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error deleting announcement.' });
  }
};
