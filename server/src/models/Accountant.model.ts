import mongoose, { Document, Schema } from 'mongoose';

export interface IAccountant extends Document {
  userId?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  qualification: string;
  employeeId: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

const AccountantSchema = new Schema<IAccountant>(
  {
    userId:          { type: Schema.Types.ObjectId, ref: 'User' },
    firstName:       { type: String, required: true, trim: true },
    lastName:        { type: String, required: true, trim: true },
    email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:           { type: String, default: '' },
    subject:         { type: String, required: true, trim: true },
    qualification:   { type: String, default: '' },
    employeeId:      { type: String, required: true, unique: true, trim: true },
    status:          { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

const Accountant = mongoose.model<IAccountant>('Accountant', AccountantSchema);
export default Accountant;
