import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  targetAudience: 'all' | 'students' | 'teachers' | 'streams';
  targetStreams?: string[];
  priority: 'normal' | 'important' | 'urgent';
  status: 'active' | 'archived';
  pinned: boolean;
  postedAt: Date;
  expiresAt?: Date;
  postedBy?: string;
  readCount?: number;
  totalRecipients?: number;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title:          { type: String, required: true, trim: true },
    message:        { type: String, required: true, trim: true },
    targetAudience: { type: String, enum: ['all', 'students', 'teachers', 'streams'], default: 'all' },
    targetStreams:  { type: [String], default: [] },
    priority:       { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
    status:         { type: String, enum: ['active', 'archived'], default: 'active' },
    pinned:         { type: Boolean, default: false },
    postedAt:       { type: Date, default: Date.now },
    expiresAt:      { type: Date },
    postedBy:       { type: String, default: '' },
    readCount:      { type: Number, default: 0 },
    totalRecipients:{ type: Number, default: 0 },
  },
  { timestamps: true }
);

const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
export default Announcement;
