import mongoose, { Document, Schema } from 'mongoose';
import { IStartup } from './Startup';

export interface IDocument extends Document {
  startupId: mongoose.Types.ObjectId | IStartup;
  name: string;
  type: string;
  fileUrl: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStartupDocument extends IDocument {
  startupId: mongoose.Types.ObjectId | IStartup;
  name: string;
  type: string;
  fileUrl: string;
  size: number;
}

const DocumentSchema = new Schema<IDocument>({
  startupId: {
    type: Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  name: {
    type: String,
    required: true
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
}, { timestamps: true });

const StartupDocument = mongoose.model<IDocument>('Document', DocumentSchema);

export default StartupDocument;