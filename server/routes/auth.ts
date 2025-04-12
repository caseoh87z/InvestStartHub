import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { log } from '../vite';
import mongoose from 'mongoose';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'launchblocks-secret-key';

// Utility function to check MongoDB connection
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1; // 1 = connected
};

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please try again later.',
        error: 'MONGODB_UNAVAILABLE'
      });
    }

    const { email, password, role, walletAddress } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({
      email,
      password, // Will be hashed by the User model pre-save hook
      role,
      walletAddress
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user data without password
    const userData = user.toObject();
    const { password: _, ...userWithoutPassword } = userData;
    
    res.status(201).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    log(`Registration error: ${error}`, 'auth');
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please try again later.',
        error: 'MONGODB_UNAVAILABLE'
      });
    }

    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user data without password
    const userData = user.toObject();
    const { password: _, ...userWithoutPassword } = userData;
    
    res.status(200).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    log(`Login error: ${error}`, 'auth');
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/user', async (req: Request, res: Response) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please try again later.',
        error: 'MONGODB_UNAVAILABLE'
      });
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ user });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    log(`Get user error: ${error}`, 'auth');
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify wallet address
router.post('/verify-wallet', async (req: Request, res: Response) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please try again later.',
        error: 'MONGODB_UNAVAILABLE'
      });
    }

    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false,
        message: 'Wallet address is required' 
      });
    }
    
    // Get user ID from token
    const authHeader = req.headers.authorization;
    let userId;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        userId = decoded.id;
      } catch (error) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid or expired token' 
        });
      }
    }
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    // Check if wallet already exists
    const existingUser = await User.findOne({ walletAddress });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ 
        success: false,
        message: 'Wallet address already in use by another account' 
      });
    }
    
    // Update the user
    const user = await User.findByIdAndUpdate(
      userId,
      { walletAddress },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Wallet address connected successfully',
      user
    });
  } catch (error) {
    log(`Wallet verification error: ${error}`, 'auth');
    res.status(500).json({ 
      success: false,
      message: 'Server error during wallet verification' 
    });
  }
});

export default router;