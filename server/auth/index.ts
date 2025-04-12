import { Express, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { log } from '../vite';
import User, { IUser } from '../models/User';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'launchblocks-secret-key';
const TOKEN_EXPIRY = '7d';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Generate JWT token
export const generateToken = (user: IUser): string => {
  // Include both MongoDB ObjectID (_id) and a conventional id field for compatibility
  const userId = user._id ? user._id.toString() : '';
  
  return jwt.sign(
    { 
      id: userId, 
      _id: userId, // Explicitly include MongoDB's _id as a string
      email: user.email, 
      role: user.role,
      walletAddress: user.walletAddress
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

// Verify JWT token
export const verifyToken = (token: string): {id: string, _id: string, email: string, role: string, walletAddress?: string} | null => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Auth middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    log(`Auth header: ${authHeader ? 'present' : 'missing'}`, 'auth');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      log('No valid Bearer token found in Authorization header', 'auth');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    log(`Verifying token: ${token.substring(0, 15)}...`, 'auth');
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      log('Token verification failed', 'auth');
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    log(`Token decoded successfully, user ID: ${decoded.id}`, 'auth');
    
    // Find user by ID
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      log(`User with ID ${decoded.id} not found in database`, 'auth');
      return res.status(401).json({ message: 'User not found' });
    }
    
    log(`User found and authenticated: ${user.email}`, 'auth');
    
    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    log(`Authentication error: ${error}`, 'auth');
    return res.status(500).json({ message: 'Server error' });
  }
};

// Role-based authorization middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    next();
  };
};

// Register routes
export const registerAuthRoutes = (app: Express) => {
  // Register user
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password: userPassword, role, walletAddress } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Create new user
      const user = new User({
        email,
        password: userPassword,
        role,
        walletAddress
      });
      
      await user.save();
      
      // Generate token
      const token = generateToken(user);
      
      // Return user data without password
      const userData = user.toObject();
      const { password: pwd, ...userWithoutPassword } = userData;
      
      res.status(201).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      log(`Registration error: ${error}`, 'auth');
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Login user
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password: userPassword } = req.body;
      
      // Find user by email
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Check password
      const isMatch = await user.comparePassword(userPassword);
      
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Generate token
      const token = generateToken(user);
      
      // Return user data without password
      const userData = user.toObject();
      const { password: pwd, ...userWithoutPassword } = userData;
      
      res.status(200).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      log(`Login error: ${error}`, 'auth');
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get current user
  app.get('/api/auth/user', authenticate, (req: Request, res: Response) => {
    res.status(200).json({ user: req.user });
  });
  
  // Verify wallet address
  app.post('/api/auth/verify-wallet', authenticate, async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }
      
      // Update user's wallet address
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { walletAddress },
        { new: true }
      ).select('-password');
      
      res.status(200).json({ user });
    } catch (error) {
      log(`Wallet verification error: ${error}`, 'auth');
      res.status(500).json({ message: 'Server error' });
    }
  });
};