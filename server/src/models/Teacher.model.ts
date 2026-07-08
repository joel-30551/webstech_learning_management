import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacher extends Document {
  userId?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  qualification: string;
  assignedClasses: string[];
  employeeId: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    userId:          { type: Schema.Types.ObjectId, ref: 'User' },
    firstName:       { type: String, required: true, trim: true },
    lastName:        { type: String, required: true, trim: true },
    email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:           { type: String, default: '' },
    subject:         { type: String, required: true, trim: true },
    qualification:   { type: String, default: '' },
    assignedClasses: { type: [String], default: [] },
    employeeId:      { type: String, required: true, unique: true, trim: true },
    status:          { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);
export default Teacher;
