import express from 'express';
import mongoose from 'mongoose';
import { log } from './vite';

const app = express();
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// MongoDB connection
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log('Connected to MongoDB Atlas', 'mongodb');
    return true;
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongodb');
    return false;
  }
};

// Start server
const port = 5000;

(async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      log('Failed to connect to MongoDB, but continuing', 'server');
    }
    
    app.listen(port, '0.0.0.0', () => {
      log(`Server running on port ${port}`, 'server');
    });
  } catch (error) {
    log(`Server error: ${error}`, 'server');
    process.exit(1);
  }
})();