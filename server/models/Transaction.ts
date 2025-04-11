import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IStartup } from './Startup';

export interface ITransaction extends Document {
  startupId: mongoose.Types.ObjectId | IStartup;
  investorId: mongoose.Types.ObjectId | IUser;
  amount: number;
  method: 'metamask' | 'upi' | 'smart_contract';
  transactionId?: string;
  status: 'pending' | 'completed' | 'active' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
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
    required: true,
    min: 0
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
    default: 'pending'
  }
}, { timestamps: true });

// Update startup stats when transaction is completed
TransactionSchema.post('save', async function(doc) {
  if (doc.status === 'completed') {
    try {
      const Startup = mongoose.model('Startup');
      const startup = await Startup.findById(doc.startupId);
      
      if (startup) {
        // Update total raised amount
        startup.totalRaised = startup.totalRaised + doc.amount;
        
        // Check if this is a new investor
        const isNewInvestor = await mongoose.model('Transaction').countDocuments({
          startupId: doc.startupId,
          investorId: doc.investorId,
          status: 'completed',
          _id: { $ne: doc._id }
        }) === 0;
        
        if (isNewInvestor) {
          startup.totalInvestors = startup.totalInvestors + 1;
        }
        
        await startup.save();
      }
    } catch (error) {
      console.error('Error updating startup stats:', error);
    }
  }
});

const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;