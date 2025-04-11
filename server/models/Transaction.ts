import mongoose, { Document, Schema } from 'mongoose';
import { IStartup } from './Startup';
import { IUser } from './User';

export interface ITransaction extends Document {
  startupId: mongoose.Types.ObjectId | IStartup;
  investorId: mongoose.Types.ObjectId | IUser;
  amount: number;
  method: 'metamask' | 'upi' | 'smart_contract';
  transactionId?: string;
  status: 'pending' | 'completed' | 'active' | 'cancelled';
}

const TransactionSchema = new Schema<ITransaction>({
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
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['metamask', 'upi', 'smart_contract'],
    required: true
  },
  transactionId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'active', 'cancelled'],
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);