import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  password: string;
  role: 'admin' | 'teacher' | 'student' | 'accountant';
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username:  { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:  { type: String, required: true, minlength: 6 },
    role:      { type: String, enum: ['admin', 'teacher', 'student', 'accountant'], default: 'student' },
    firstName: { type: String, default: '' },
    lastName:  { type: String, default: '' },
    isActive:  { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving (Mongoose v9: promise-based, no next callback)
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);
export default User;

