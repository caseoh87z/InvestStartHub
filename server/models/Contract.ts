import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IStartup } from './Startup';

export interface IContract extends Document {
  startupId: mongoose.Types.ObjectId | IStartup;
  investorId: mongoose.Types.ObjectId | IUser;
  contractAddress: string;
  startupWalletAddress: string;
  investorWalletAddress: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>({
  startupId: {
    type: Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  investorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contractAddress: {
    type: String,
    required: true,
    trim: true
  },
  startupWalletAddress: {
    type: String,
    required: true,
    trim: true
  },
  investorWalletAddress: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, { timestamps: true });

const Contract = mongoose.model<IContract>('Contract', ContractSchema);

export default Contract;