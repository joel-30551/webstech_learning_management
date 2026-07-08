import { Request, Response } from 'express';
import Accountant from '../models/Accountant.model';
import User from '../models/User.model';

// GET all accountants (with optional search)
export const getAccountant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
        { employeeId:{ $regex: search, $options: 'i' } },
      ];
    }
    const accountant = await Accountant.find(filter).sort({ createdAt: -1 });
    res.json(accountant);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching accountants.' });
  }
};

// GET logged-in accountant's own profile
export const getAccountantProfileMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }
    const accountant = await Accountant.findOne({ userId: user._id });
    if (!accountant) {
      res.status(404).json({ message: 'Accountant profile not found.' });
      return;
    }
    res.json(accountant);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching profile.' });
  }
};

// GET single 
export const getAccountantById = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountant = await Accountant.findById(req.params.id);
    if (!accountant) { res.status(404).json({ message: 'Accountant not found.' }); return; }
    res.json(accountant);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching accountant.' });
  }
};

// POST create 
export const createAccountant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, qualification, employeeId, status } = req.body;
    if (!firstName || !lastName || !email || !employeeId) {
      res.status(400).json({ message: 'First name, last name, email, and employee ID are required.' });
      return;
    }
    const existing = await Accountant.findOne({ $or: [{ email }, { employeeId }] });
    if (existing) { res.status(400).json({ message: 'An Accountant with this email or employee ID already exists.' }); return; }

    // Generate unique username
    const baseUsername = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Auto-create corresponding User account
    const newUser = new User({
      username,
      password: 'accountant1234', // Default password
      role: 'accountant',
      firstName,
      lastName,
      isActive: status !== 'inactive',
    });
    await newUser.save();

    const accountant = await Accountant.create({
      userId: newUser._id,
      firstName,
      lastName,
      email,
      phone,
      subject: 'Accounting',
      qualification,
      employeeId,
      status: status || 'active'
    });

    res.status(201).json(accountant);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating accountant.' });
  }
};

// PUT update 
export const updateAccountant = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountant = await Accountant.findById(req.params.id);
    if (!accountant) {
      res.status(404).json({ message: 'Accountant not found.' });
      return;
    }

    const { firstName, lastName, status } = req.body;
    Object.assign(accountant, req.body);
    await accountant.save();

    // Sync corresponding User account details
    if (accountant.userId) {
      const user = await User.findById(accountant.userId);
      if (user) {
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (status) user.isActive = status === 'active';
        await user.save();
      }
    }

    res.json(accountant);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating accountant.' });
  }
};

// DELETE 
export const deleteAccountant = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountant = await Accountant.findById(req.params.id);
    if (!accountant) {
      res.status(404).json({ message: 'Accountant not found.' });
      return;
    }

    if (accountant.userId) {
      await User.findByIdAndDelete(accountant.userId);
    }
    await Accountant.findByIdAndDelete(req.params.id);

    res.json({ message: 'Accountant deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error deleting accountant.' });
  }
};
