import { Request, Response } from 'express';
import Teacher from '../models/Teacher.model';
import User from '../models/User.model';

// GET all teachers (with optional search)
export const getTeachers = async (req: Request, res: Response): Promise<void> => {
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
        { subject:   { $regex: search, $options: 'i' } },
        { employeeId:{ $regex: search, $options: 'i' } },
      ];
    }
    const teachers = await Teacher.find(filter).sort({ createdAt: -1 });
    res.json(teachers);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching teachers.' });
  }
};

// GET logged-in teacher's profile
export const getTeacherProfileMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }
    const teacher = await Teacher.findOne({ userId: user._id });
    if (!teacher) {
      res.status(404).json({ message: 'Teacher profile not found.' });
      return;
    }
    res.json(teacher);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching profile.' });
  }
};

// GET single teacher by ID
export const getTeacherById = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) { res.status(404).json({ message: 'Teacher not found.' }); return; }
    res.json(teacher);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching teacher.' });
  }
};

// POST create teacher
export const createTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, subject, qualification, assignedClasses, employeeId, status } = req.body;
    if (!firstName || !lastName || !email || !subject || !employeeId) {
      res.status(400).json({ message: 'First name, last name, email, subject, and employee ID are required.' });
      return;
    }
    const existing = await Teacher.findOne({ $or: [{ email }, { employeeId }] });
    if (existing) { res.status(400).json({ message: 'A teacher with this email or employee ID already exists.' }); return; }

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
      password: 'teacher1234', // Default password
      role: 'teacher',
      firstName,
      lastName,
      isActive: status !== 'inactive',
    });
    await newUser.save();

    const teacher = await Teacher.create({
      userId: newUser._id,
      firstName,
      lastName,
      email,
      phone,
      subject,
      qualification,
      assignedClasses: assignedClasses || [],
      employeeId,
      status: status || 'active'
    });

    res.status(201).json(teacher);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating teacher.' });
  }
};

// PUT update teacher
export const updateTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      res.status(404).json({ message: 'Teacher not found.' });
      return;
    }

    const { firstName, lastName, status } = req.body;
    Object.assign(teacher, req.body);
    await teacher.save();

    // Sync corresponding User account details
    if (teacher.userId) {
      const user = await User.findById(teacher.userId);
      if (user) {
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (status) user.isActive = status === 'active';
        await user.save();
      }
    }

    res.json(teacher);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating teacher.' });
  }
};

// DELETE teacher
export const deleteTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      res.status(404).json({ message: 'Teacher not found.' });
      return;
    }

    if (teacher.userId) {
      await User.findByIdAndDelete(teacher.userId);
    }
    await Teacher.findByIdAndDelete(req.params.id);

    res.json({ message: 'Teacher deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error deleting teacher.' });
  }
};
