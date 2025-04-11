import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { log } from '../vite';
import mongoose from 'mongoose';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'launchblocks-secret-key';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
    }
  }
}

// Utility function to check MongoDB connection
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1; // 1 = connected
};

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
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
      
      // Add user info to request object
      req.user = user;
      req.userId = decoded.id; // Use the id from the JWT token
      
      next();
    } catch (error) {
      log(`Token verification error: ${error}`, 'auth');
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    log(`Authentication error: ${error}`, 'auth');
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Authorization middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized. Insufficient permissions.' });
    }
    
    next();
  };
};