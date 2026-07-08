import { Request, Response } from 'express';
import User from '../models/User.model';

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const reqUser = (req as any).user;

    if (!reqUser) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required.' });
      return;
    }

    // Retrieve user with password included
    const user = await User.findById(reqUser._id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ message: 'Incorrect current password.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters long.' });
      return;
    }

    user.password = newPassword;
    await user.save(); // UserSchema pre('save') hashes it

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error changing password.' });
  }
};
