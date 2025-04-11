import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertStartupSchema, 
  insertDocumentSchema, 
  insertTransactionSchema, 
  insertMessageSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Server as SocketServer } from "socket.io";

const JWT_SECRET = process.env.JWT_SECRET || "launchblocks_secret_key";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Socket.io setup for real-time messaging
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  // Socket.io connection handling
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    // Join a room based on user ID
    socket.on("join", (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });
    
    // Handle new messages
    socket.on("send_message", async (data: { senderId: number, receiverId: number, content: string }) => {
      try {
        const message = await storage.createMessage({
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content
        });
        
        // Send to both sender and receiver
        io.to(data.receiverId.toString()).emit("receive_message", message);
        io.to(data.senderId.toString()).emit("message_sent", message);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });
    
    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
  
  // Authentication middleware
  const authenticateUser = async (req: Request, res: Response, next: Function) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      const user = await storage.getUser(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      req.body.authenticatedUser = user;
      next();
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ message: "Authentication failed" });
    }
  };
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, role } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        role,
        walletAddress: req.body.walletAddress || null
      });
      
      // Generate token
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      // Return user data (excluding password) and token
      const { password: _, ...userData } = user;
      res.status(201).json({ user: userData, token });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate token
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      // Return user data (excluding password) and token
      const { password: _, ...userData } = user;
      res.json({ user: userData, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });
  
  app.post("/api/auth/verify-wallet", async (req, res) => {
    try {
      const { walletAddress, userId } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Check if wallet already exists
      const existingUser = await storage.getUserByWalletAddress(walletAddress);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Wallet address already in use" });
      }
      
      // If userId provided, update the user
      if (userId) {
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Update user with wallet address
        // In a real DB we would use an update query here
        const updatedUser = await storage.createUser({
          ...user,
          walletAddress
        });
        
        const { password: _, ...userData } = updatedUser;
        return res.json({ user: userData });
      }
      
      res.json({ verified: true });
    } catch (error) {
      console.error("Wallet verification error:", error);
      res.status(500).json({ message: "Failed to verify wallet" });
    }
  });
  
  // User routes
  app.get("/api/users/me", authenticateUser, async (req, res) => {
    const user = req.body.authenticatedUser;
    const { password: _, ...userData } = user;
    res.json(userData);
  });
  
  // Startup routes
  app.post("/api/startups", authenticateUser, async (req, res) => {
    try {
      const user = req.body.authenticatedUser;
      
      if (user.role !== "founder") {
        return res.status(403).json({ message: "Only founders can create startups" });
      }
      
      // Check if user already has a startup
      const existingStartup = await storage.getStartupByUserId(user.id);
      if (existingStartup) {
        return res.status(400).json({ message: "You already have a startup" });
      }
      
      const startupData = insertStartupSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const startup = await storage.createStartup(startupData);
      res.status(201).json(startup);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Startup creation error:", error);
      res.status(500).json({ message: "Failed to create startup" });
    }
  });
  
  app.get("/api/startups", async (req, res) => {
    try {
      const startups = await storage.getAllStartups();
      
      // If filters are applied
      const { industry, stage, location } = req.query;
      
      let filteredStartups = startups;
      
      if (industry) {
        filteredStartups = filteredStartups.filter(s => s.industry === industry);
      }
      
      if (stage) {
        filteredStartups = filteredStartups.filter(s => s.stage === stage);
      }
      
      if (location) {
        filteredStartups = filteredStartups.filter(s => s.location === location);
      }
      
      res.json(filteredStartups);
    } catch (error) {
      console.error("Get startups error:", error);
      res.status(500).json({ message: "Failed to get startups" });
    }
  });
  
  app.get("/api/startups/:id", async (req, res) => {
    try {
      const startupId = parseInt(req.params.id);
      const startup = await storage.getStartup(startupId);
      
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      res.json(startup);
    } catch (error) {
      console.error("Get startup error:", error);
      res.status(500).json({ message: "Failed to get startup" });
    }
  });
  
  app.put("/api/startups/:id", authenticateUser, async (req, res) => {
    try {
      const user = req.body.authenticatedUser;
      const startupId = parseInt(req.params.id);
      const startup = await storage.getStartup(startupId);
      
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      if (startup.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this startup" });
      }
      
      const updatedStartup = await storage.updateStartup(startupId, req.body);
      res.json(updatedStartup);
    } catch (error) {
      console.error("Update startup error:", error);
      res.status(500).json({ message: "Failed to update startup" });
    }
  });
  
  app.get("/api/startups/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const startup = await storage.getStartupByUserId(userId);
      
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      res.json(startup);
    } catch (error) {
      console.error("Get user startup error:", error);
      res.status(500).json({ message: "Failed to get startup" });
    }
  });
  
  // Document routes
  app.post("/api/documents", authenticateUser, async (req, res) => {
    try {
      const user = req.body.authenticatedUser;
      
      // Verify user owns the startup
      const startup = await storage.getStartup(req.body.startupId);
      if (!startup || startup.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to add documents to this startup" });
      }
      
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData);
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Document creation error:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });
  
  app.get("/api/documents/startup/:startupId", async (req, res) => {
    try {
      const startupId = parseInt(req.params.startupId);
      const documents = await storage.getDocumentsByStartupId(startupId);
      
      res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ message: "Failed to get documents" });
    }
  });
  
  app.delete("/api/documents/:id", authenticateUser, async (req, res) => {
    try {
      const user = req.body.authenticatedUser;
      const documentId = parseInt(req.params.id);
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Verify user owns the startup
      const startup = await storage.getStartup(document.startupId);
      if (!startup || startup.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this document" });
      }
      
      const result = await storage.deleteDocument(documentId);
      if (result) {
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to delete document" });
      }
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  
  // Transaction routes
  app.post("/api/transactions", authenticateUser, async (req, res) => {
    try {
      const user = req.body.authenticatedUser;
      
      if (user.role !== "investor") {
        return res.status(403).json({ message: "Only investors can create transactions" });
      }
      
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        investorId: user.id,
        status: "pending" // Always start as pending
      });
      
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Transaction creation error:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });
  
  app.put("/api/transactions/:id/status", authenticateUser, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'completed', 'failed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedTransaction = await storage.updateTransactionStatus(transactionId, status);
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Update transaction error:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });
  
  app.get("/api/transactions/startup/:startupId", authenticateUser, async (req, res) => {
    try {
      const startupId = parseInt(req.params.startupId);
      const user = req.body.authenticatedUser;
      
      // Get the startup
      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      // Only allow founders to see their own startup transactions
      if (user.role === "founder" && startup.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to view these transactions" });
      }
      
      const transactions = await storage.getTransactionsByStartupId(startupId);
      res.json(transactions);
    } catch (error) {
      console.error("Get startup transactions error:", error);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });
  
  app.get("/api/transactions/investor", authenticateUser, async (req, res) => {
    try {
      const user = req.body.authenticatedUser;
      
      if (user.role !== "investor") {
        return res.status(403).json({ message: "Only investors can access their transactions" });
      }
      
      const transactions = await storage.getTransactionsByInvestorId(user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Get investor transactions error:", error);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });
  
  // Message routes
  app.get("/api/messages/:userId", authenticateUser, async (req, res) => {
    try {
      const user = req.body.authenticatedUser;
      const otherUserId = parseInt(req.params.userId);
      
      const messages = await storage.getMessagesBetweenUsers(user.id, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  
  app.get("/api/messages/unread/count", authenticateUser, async (req, res) => {
    try {
      const user = req.body.authenticatedUser;
      const unreadMessages = await storage.getUnreadMessagesByUserId(user.id);
      
      res.json({ count: unreadMessages.length });
    } catch (error) {
      console.error("Get unread messages error:", error);
      res.status(500).json({ message: "Failed to get unread messages" });
    }
  });
  
  app.put("/api/messages/:id/read", authenticateUser, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const user = req.body.authenticatedUser;
      
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Only recipient can mark message as read
      if (message.receiverId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this message" });
      }
      
      const updatedMessage = await storage.markMessageAsRead(messageId);
      res.json(updatedMessage);
    } catch (error) {
      console.error("Mark message as read error:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });
  
  return httpServer;
}
