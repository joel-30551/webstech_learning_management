import mongoose, { Document, Schema } from 'mongoose';

export type Term = 'First Term' | 'Second Term' | 'Third Term';
export type FeeStatus = 'paid' | 'partial' | 'unpaid';
export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Cheque';

export interface IFee extends Document {
  studentId: mongoose.Types.ObjectId; // ref to Student._id
  class: string;
  term: Term;
  academicYear: string;
  totalFee: number;
  amountPaid: number;
  balance: number;
  status: FeeStatus;
  paymentMethod: PaymentMethod;
  receivedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const FeeSchema = new Schema<IFee>(
  {
    studentId:     { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    class:         { type: String, required: true, trim: true },
    term:          { type: String, enum: ['First Term', 'Second Term', 'Third Term'], required: true },
    academicYear:  { type: String, required: true, trim: true },
    totalFee:      { type: Number, required: true, min: 0 },
    amountPaid:    { type: Number, required: true, min: 0, default: 0 },
    balance:       { type: Number, default: 0 },
    status:        { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
    paymentMethod: { type: String, enum: ['Cash', 'Mobile Money', 'Bank Transfer', 'Cheque'], required: true },
    receivedBy:    { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Keep balance/status in sync whenever amountPaid or totalFee changes
FeeSchema.pre('save', function (next) {
  this.balance = this.totalFee - this.amountPaid;

  if (this.amountPaid <= 0) {
    this.status = 'unpaid';
  } else if (this.amountPaid >= this.totalFee) {
    this.status = 'paid';
    this.balance = 0;
  } else {
    this.status = 'partial';
  }

  next();
});

FeeSchema.index({ studentId: 1, term: 1, academicYear: 1 }, { unique: true });
FeeSchema.index({ class: 1, term: 1, academicYear: 1 });

const Fee = mongoose.model<IFee>('Fee', FeeSchema);
export default Fee;