import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IStartup extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  name: string;
  description: string;
  pitch: string;
  stage: string;
  industry: string;
  location: string;
  upiId?: string;
  upiQrCode?: string;
  walletAddress?: string;
  totalRaised: number;
  totalInvestors: number;
}

const StartupSchema = new Schema<IStartup>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  pitch: {
    type: String,
    required: true
  },
  stage: {
    type: String,
    required: true,
    enum: ['Idea', 'Prototype', 'MVP', 'Growth', 'Scale']
  },
  industry: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  upiId: {
    type: String,
    trim: true
  },
  upiQrCode: {
    type: String
  },
  walletAddress: {
    type: String,
    trim: true
  },
  totalRaised: {
    type: Number,
    default: 0
  },
  totalInvestors: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Validate that founder has only one startup
StartupSchema.pre('save', async function(next) {
  // Only check on new startup creation
  if (!this.isNew) return next();
  
  const count = await mongoose.models.Startup.countDocuments({ userId: this.userId });
  if (count > 0) {
    const error = new Error('User already has a startup registered');
    return next(error);
  }
  
  next();
});

const Startup = mongoose.model<IStartup>('Startup', StartupSchema);

export default Startup;