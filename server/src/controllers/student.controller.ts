import { Request, Response } from 'express';
import Student from '../models/Student.model';
import User from '../models/User.model';

// GET all students (with search + filter)
export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, classLevel, gender } = req.query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (status) filter.status = status;
    if (classLevel) filter.classLevel = classLevel;
    if (gender) filter.gender = gender;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { program:   { $regex: search, $options: 'i' } },
      ];
    }
    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching students.' });
  }
};

// GET logged-in student's profile
export const getStudentProfileMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }
    const student = await Student.findOne({ userId: user._id });
    if (!student) {
      res.status(404).json({ message: 'Student profile not found.' });
      return;
    }
    res.json(student);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching profile.' });
  }
};

// GET single student by ID
export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) { res.status(404).json({ message: 'Student not found.' }); return; }
    res.json(student);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching student.' });
  }
};

// POST create student
export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName, lastName, email, phone, studentId,
      classLevel: classLevelRaw, class: classAlias,
      program: programRaw, course: courseAlias,
      gender,
      dateOfBirth: dobRaw, dob: dobAlias,
      guardianName, guardianPhone, status
    } = req.body;
    const classLevel = classLevelRaw || classAlias;
    const program    = programRaw    || courseAlias || '';
    const dateOfBirth = dobRaw       || dobAlias;
    if (!firstName || !lastName || !email || !studentId || !classLevel || !gender || !dateOfBirth) {
      res.status(400).json({ message: 'First name, last name, email, student ID, class level, gender, and date of birth are required.' });
      return;
    }
    const existing = await Student.findOne({ $or: [{ email }, { studentId }] });
    if (existing) { res.status(400).json({ message: 'A student with this email or student ID already exists.' }); return; }

    // Generate unique username from studentId or name
    const username = studentId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const userExists = await User.findOne({ username });
    if (userExists) {
      res.status(400).json({ message: `A user account with username/studentId '${username}' already exists.` });
      return;
    }

    // Auto-create corresponding User account
    const newUser = new User({
      username,
      password: 'student1234', // Default password
      role: 'student',
      firstName,
      lastName,
      isActive: status !== 'inactive',
    });
    await newUser.save();

    const student = await Student.create({
      userId: newUser._id,
      firstName,
      lastName,
      email,
      phone,
      studentId,
      classLevel,
      program,
      gender,
      dateOfBirth,
      guardianName,
      guardianPhone,
      status: status || 'active'
    });

    res.status(201).json(student);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating student.' });
  }
};

// PUT update student
export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      res.status(404).json({ message: 'Student not found.' });
      return;
    }

    const { firstName, lastName, status } = req.body;
    Object.assign(student, req.body);
    await student.save();

    // Sync corresponding User account details
    if (student.userId) {
      const user = await User.findById(student.userId);
      if (user) {
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (status) user.isActive = status === 'active';
        await user.save();
      }
    }

    res.json(student);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating student.' });
  }
};

// DELETE student
export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      res.status(404).json({ message: 'Student not found.' });
      return;
    }

    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
    }
    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: 'Student deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error deleting student.' });
  }
};
