import { Request, Response } from 'express';
import User from '../models/User.model';

// GET /api/user-accounts
export const getUserAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, role, isActive } = req.query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (role) filter.role = role;
    if (isActive) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { username:  { $regex: search, $options: 'i' } },
      ];
    }

    const accounts = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching user accounts.' });
  }
};

// POST /api/user-accounts
export const createUserAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, role, isActive, password } = req.body;

    if (!firstName || !lastName || !role || !password) {
      res.status(400).json({ message: 'First name, last name, role, and password are required.' });
      return;
    }

    // Generate a clean, unique username
    const baseUsername = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const newUser = new User({
      username,
      password,
      role,
      firstName,
      lastName,
      isActive: isActive !== false,
    });

    await newUser.save();

    // Do not return password
    const responseUser = newUser.toObject();
    delete (responseUser as any).password;

    res.status(201).json(responseUser);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating user account.' });
  }
};

// PUT /api/user-accounts/:id
export const updateUserAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, role, isActive, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ message: 'User account not found.' });
      return;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password; // pre-save hook will hash it

    await user.save();

    const responseUser = user.toObject();
    delete (responseUser as any).password;

    res.json(responseUser);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating user account.' });
  }
};

// DELETE /api/user-accounts/:id
export const deleteUserAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User account not found.' });
      return;
    }
    res.json({ message: 'User account deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error deleting user account.' });
  }
};

// PATCH /api/user-accounts/:id/status
export const updateUserAccountStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined) {
      res.status(400).json({ message: 'Status is required.' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User account not found.' });
      return;
    }

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating user account status.' });
  }
};
