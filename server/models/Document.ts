import mongoose, { Document as IDocument, Schema } from 'mongoose';
import { IStartup } from './Startup';

export interface IStartupDocument extends IDocument {
  startupId: mongoose.Types.ObjectId | IStartup;
  name: string;
  type: string;
  fileUrl: string;
  size: number;
}

const DocumentSchema = new Schema<IStartupDocument>({
  startupId: {
    type: Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IStartupDocument>('Document', DocumentSchema);