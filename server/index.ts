import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import { registerRoutes } from "./routes";
import { registerAuthRoutes } from "./auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);

// Register additional auth routes
registerAuthRoutes(app);

// Connect to MongoDB
const connectDB = async (): Promise<boolean> => {
  if (!process.env.MONGODB_URI) {
    log('MONGODB_URI environment variable is not defined', 'mongodb');
    return false;
  }

  try {
    // Increase timeout for MongoDB connection
    const options = {
      serverSelectionTimeoutMS: 5000, // 5 seconds
      connectTimeoutMS: 10000, // 10 seconds
    };
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    log('Connected to MongoDB Atlas', 'mongodb');
    return true;
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongodb');
    return false;
  }
};

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  log(`Error: ${message}`, 'server');
});

// Start the server
(async () => {
  try {
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Register API routes
    await registerRoutes(app);
    
    // Setup Vite in development
    if (app.get("env") === "development") {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }

    // Start server first
    const port = 5000;
    httpServer.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server running on port ${port}`, 'server');
      
      // Connect to MongoDB after server is running
      connectDB().then(connected => {
        if (!connected) {
          log('Failed to connect to MongoDB, but server will continue running', 'server');
        }
      }).catch(err => {
        log(`MongoDB connection error after server start: ${err}`, 'server');
      });
    });
  } catch (error) {
    log(`Server error: ${error}`, 'server');
    process.exit(1);
  }
})();