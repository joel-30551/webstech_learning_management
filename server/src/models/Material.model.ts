import mongoose, { Document, Schema } from 'mongoose';

export interface IMaterial extends Document {
  title: string;
  subject: string;
  classLevel: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  uploadedAt: Date;
  uploadedBy?: string;
  accessCount?: number;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    title:       { type: String, required: true, trim: true },
    subject:     { type: String, required: true, trim: true },
    classLevel:  { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    fileUrl:     { type: String, required: true },
    fileName:    { type: String, required: true },
    fileSize:    { type: Number, default: 0 },
    uploadedAt:  { type: Date, default: Date.now },
    uploadedBy:  { type: String, default: '' },
    accessCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Material = mongoose.model<IMaterial>('Material', MaterialSchema);
export default Material;
