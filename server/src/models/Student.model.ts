import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  userId?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentId: string;
  classLevel: string;
  program: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: Date;
  guardianName: string;
  guardianPhone: string;
  status: 'active' | 'inactive' | 'graduated';
  createdAt?: Date;
  updatedAt?: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User' },
    firstName:     { type: String, required: true, trim: true },
    lastName:      { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:         { type: String, default: '' },
    studentId:     { type: String, required: true, unique: true, trim: true },
    classLevel:    { type: String, required: true, trim: true },
    program:       { type: String, default: '' },
    gender:        { type: String, enum: ['male', 'female', 'other'], required: true },
    dateOfBirth:   { type: Date, required: true },
    guardianName:  { type: String, default: '' },
    guardianPhone: { type: String, default: '' },
    status:        { type: String, enum: ['active', 'inactive', 'graduated'], default: 'active' },
  },
  { timestamps: true }
);

const Student = mongoose.model<IStudent>('Student', StudentSchema);
export default Student;
