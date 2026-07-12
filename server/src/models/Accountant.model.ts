import mongoose, { Document, Schema } from 'mongoose';

export interface IAccountant extends Document {
  userId?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  employeeId: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
  fullName?: string;
  accountantId?: string;
}

const AccountantSchema = new Schema<IAccountant>(
  {
    userId:          { type: Schema.Types.ObjectId, ref: 'User' },
    firstName:       { type: String, required: true, trim: true },
    lastName:        { type: String, required: true, trim: true },
    email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:           { type: String, default: '' },
    qualification:   { type: String, default: '' },
    employeeId:      { type: String, required: true, unique: true, trim: true },
    status:          { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: fullName
AccountantSchema.virtual('fullName').get(function (this: IAccountant) {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Virtual: accountantId (alias for employeeId — used by the frontend)
AccountantSchema.virtual('accountantId').get(function (this: IAccountant) {
  return this.employeeId;
});

const Accountant = mongoose.model<IAccountant>('Accountant', AccountantSchema);
export default Accountant;
