import mongoose, { Document, Schema } from 'mongoose';

export interface ITimetable extends Document {
  title: string;
  term: 'First Term' | 'Second Term' | 'Third Term';
  stream: 'WASSCE' | 'NOVDEC';
  academicYear: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  cloudinaryPublicId: string;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const TimetableSchema = new Schema<ITimetable>(
  {
    title:              { type: String, required: true, trim: true },
    term:                { type: String, enum: ['First Term', 'Second Term', 'Third Term'], required: true },
    stream:              { type: String, enum: ['WASSCE', 'NOVDEC'], required: true },
    academicYear:        { type: String, required: true, trim: true },
    fileUrl:             { type: String, required: true },
    fileName:            { type: String, required: true },
    fileSize:            { type: Number },
    cloudinaryPublicId:  { type: String, required: true },
    uploadedBy:          { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

TimetableSchema.index({ term: 1, stream: 1, academicYear: 1 });

const Timetable = mongoose.model<ITimetable>('Timetable', TimetableSchema);
export default Timetable;