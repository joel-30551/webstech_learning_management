import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User.model';

const generateToken = (id: string, role: string): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '30m') as SignOptions['expiresIn'],
  };
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, options);
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
    return;
  }

  const user = await User.findOne({ username: username.toLowerCase() });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ message: 'Invalid username or password.' });
    return;
  }

  const token = generateToken(user._id.toString(), user.role);

  res.status(200).json({
    message: 'Login successful',
    token,
    user: { id: user._id, username: user.username, role: user.role },
  });
};

// POST /api/auth/logout  (client-side only — just a confirmation)
export const logout = (_req: Request, res: Response): void => {
  res.status(200).json({ message: 'Logged out successfully.' });
};
