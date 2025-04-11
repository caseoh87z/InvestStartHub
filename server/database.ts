import mongoose from 'mongoose';
import { log } from './vite';

// MongoDB connection
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log('Connected to MongoDB Atlas', 'mongodb');
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongodb');
    process.exit(1);
  }
};

export default connectDB;