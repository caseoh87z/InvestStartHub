import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId | IUser;
  receiverId: mongoose.Types.ObjectId | IUser;
  content: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create indexes for faster queries
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ receiverId: 1, read: 1 });

const Message = mongoose.model<IMessage>('Message', MessageSchema);

export default Message;