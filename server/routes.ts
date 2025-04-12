import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { ZodError } from "zod";
import { authenticate } from "./auth";
import { setupSocketIO } from "./socket";
import User from "./models/User";
import Startup from "./models/Startup";
import Transaction from "./models/Transaction";
import Document from "./models/Document";
import Message from "./models/Message";
import Contract from "./models/Contract";
import { log } from "./vite";
import mongoose from "mongoose";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup Socket.io with our custom manager
  setupSocketIO(httpServer);
  
  // User routes
  app.get("/api/users/me", authenticate, async (req: Request, res: Response) => {
    try {
      log(`Fetching user data for user ID: ${req.user?._id || 'unknown'}`, 'api');
      res.json({ user: req.user });
    } catch (error) {
      log(`Error in /api/users/me: ${error}`, 'api');
      res.status(500).json({ message: "Failed to retrieve user data" });
    }
  });

  app.get("/api/users", authenticate, async (req: Request, res: Response) => {
    try {
      // Get all users but remove sensitive information
      const users = await User.find().select('-password');
      res.json(users);
    } catch (error) {
      log(`Get users error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Change password endpoint
  app.post("/api/users/change-password", authenticate, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          success: false,
          message: "Current password and new password are required" 
        });
      }
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }
      
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false,
          message: "Current password is incorrect" 
        });
      }
      
      // Update to new password
      user.password = newPassword;
      await user.save();
      
      res.json({ 
        success: true,
        message: "Password updated successfully" 
      });
    } catch (error) {
      log(`Change password error: ${error}`, 'api');
      res.status(500).json({ 
        success: false,
        message: "Failed to change password" 
      });
    }
  });
  
  // Startup routes
  app.post("/api/startups", authenticate, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (user.role !== "founder") {
        return res.status(403).json({ message: "Only founders can create startups" });
      }
      
      // Check if user already has a startup
      const existingStartup = await Startup.findOne({ userId: user._id });
      if (existingStartup) {
        return res.status(400).json({ message: "You already have a startup" });
      }
      
      const startupData = {
        ...req.body,
        userId: user._id
      };
      
      const startup = new Startup(startupData);
      await startup.save();
      
      res.status(201).json(startup);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      log(`Startup creation error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to create startup" });
    }
  });
  
  app.get("/api/startups", async (req: Request, res: Response) => {
    try {
      const { industry, stage, location } = req.query;
      
      let query: any = {};
      
      if (industry) {
        query.industry = industry;
      }
      
      if (stage) {
        query.stage = stage;
      }
      
      if (location) {
        query.location = location;
      }
      
      const startups = await Startup.find(query);
      res.json(startups);
    } catch (error) {
      log(`Get startups error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to get startups" });
    }
  });
  
  app.get("/api/startups/:id", async (req: Request, res: Response) => {
    try {
      const startupId = req.params.id;
      
      if (!mongoose.Types.ObjectId.isValid(startupId)) {
        return res.status(400).json({ message: "Invalid startup ID" });
      }
      
      const startup = await Startup.findById(startupId);
      
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      res.json(startup);
    } catch (error) {
      log(`Get startup error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to get startup" });
    }
  });
  
  app.put("/api/startups/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const startupId = req.params.id;
      
      if (!mongoose.Types.ObjectId.isValid(startupId)) {
        return res.status(400).json({ message: "Invalid startup ID" });
      }
      
      const startup = await Startup.findById(startupId);
      
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      // Check if the user is the owner of the startup
      if (startup.userId.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "You don't have permission to update this startup" });
      }
      
      // Update the startup
      Object.assign(startup, req.body);
      await startup.save();
      
      res.json(startup);
    } catch (error) {
      log(`Update startup error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to update startup" });
    }
  });
  
  app.get("/api/startups/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const startup = await Startup.findOne({ userId });
      
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      res.json(startup);
    } catch (error) {
      log(`Get user startup error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to get startup" });
    }
  });
  
  // Document routes
  app.post("/api/documents", authenticate, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { startupId } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(startupId)) {
        return res.status(400).json({ message: "Invalid startup ID" });
      }
      
      // Verify user owns the startup
      const startup = await Startup.findById(startupId);
      if (!startup || startup.userId.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "You don't have permission to add documents to this startup" });
      }
      
      const document = new Document({
        ...req.body,
        startupId
      });
      
      await document.save();
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      log(`Document creation error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to create document" });
    }
  });
  
  app.get("/api/documents/startup/:startupId", async (req: Request, res: Response) => {
    try {
      const startupId = req.params.startupId;
      
      if (!mongoose.Types.ObjectId.isValid(startupId)) {
        return res.status(400).json({ message: "Invalid startup ID" });
      }
      
      const documents = await Document.find({ startupId });
      res.json(documents);
    } catch (error) {
      log(`Get documents error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to get documents" });
    }
  });
  
  app.delete("/api/documents/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const documentId = req.params.id;
      
      if (!mongoose.Types.ObjectId.isValid(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Verify user owns the startup
      const startup = await Startup.findById(document.startupId);
      if (!startup || startup.userId.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "You don't have permission to delete this document" });
      }
      
      await Document.findByIdAndDelete(documentId);
      res.json({ success: true });
    } catch (error) {
      log(`Delete document error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  
  // Transaction routes
  app.post("/api/transactions", authenticate, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (user.role !== "investor") {
        return res.status(403).json({ message: "Only investors can create transactions" });
      }
      
      const transaction = new Transaction({
        ...req.body,
        investorId: user._id,
        status: "pending" // Always start as pending
      });
      
      await transaction.save();
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      log(`Transaction creation error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });
  
  app.put("/api/transactions/:id/status", authenticate, async (req: Request, res: Response) => {
    try {
      const transactionId = req.params.id;
      const { status } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      if (!['pending', 'completed', 'active', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const transaction = await Transaction.findByIdAndUpdate(
        transactionId,
        { status },
        { new: true }
      );
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      log(`Update transaction error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });
  
  app.get("/api/transactions/startup/:startupId", authenticate, async (req: Request, res: Response) => {
    try {
      const startupId = req.params.startupId;
      const user = req.user;
      
      if (!mongoose.Types.ObjectId.isValid(startupId)) {
        return res.status(400).json({ message: "Invalid startup ID" });
      }
      
      // Get the startup
      const startup = await Startup.findById(startupId);
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      // Only allow founders to see their own startup transactions
      if (user.role === "founder" && startup.userId.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "You don't have permission to view these transactions" });
      }
      
      const transactions = await Transaction.find({ startupId });
      res.json(transactions);
    } catch (error) {
      log(`Get startup transactions error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });
  
  app.get("/api/transactions/investor", authenticate, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (user.role !== "investor") {
        return res.status(403).json({ message: "Only investors can access their transactions" });
      }
      
      const transactions = await Transaction.find({ investorId: user._id });
      res.json(transactions);
    } catch (error) {
      log(`Get investor transactions error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });
  
  // Message routes
  app.get("/api/messages/:userId", authenticate, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const otherUserId = req.params.userId;
      
      if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const messages = await Message.find({
        $or: [
          { senderId: user._id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: user._id }
        ]
      }).sort({ createdAt: 1 });
      
      res.json(messages);
    } catch (error) {
      log(`Get messages error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  
  app.get("/api/messages/unread/count", authenticate, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const unreadMessages = await Message.countDocuments({
        receiverId: user._id,
        read: false
      });
      
      res.json({ count: unreadMessages });
    } catch (error) {
      log(`Get unread messages error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to get unread messages" });
    }
  });
  
  app.put("/api/messages/:id/read", authenticate, async (req: Request, res: Response) => {
    try {
      const messageId = req.params.id;
      const user = req.user;
      
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Only recipient can mark message as read
      if (message.receiverId.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "You don't have permission to mark this message as read" });
      }
      
      message.read = true;
      await message.save();
      
      res.json(message);
    } catch (error) {
      log(`Mark message as read error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });
  
  // Smart Contract routes
  app.post("/api/contracts", authenticate, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (user.role !== "investor") {
        return res.status(403).json({ message: "Only investors can create contracts" });
      }
      
      const { startupId, contractAddress, startupWalletAddress, investorWalletAddress } = req.body;
      
      if (!startupId || !contractAddress || !startupWalletAddress || !investorWalletAddress) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      if (!mongoose.Types.ObjectId.isValid(startupId)) {
        return res.status(400).json({ message: "Invalid startup ID" });
      }
      
      // Create the contract
      const contract = new Contract({
        startupId,
        investorId: user._id,
        contractAddress,
        startupWalletAddress,
        investorWalletAddress,
        status: 'active'
      });
      
      await contract.save();
      res.status(201).json(contract);
    } catch (error) {
      log(`Contract creation error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to create contract" });
    }
  });
  
  app.get("/api/contracts/startup/:startupId", authenticate, async (req: Request, res: Response) => {
    try {
      const startupId = req.params.startupId;
      const user = req.user;
      
      if (!mongoose.Types.ObjectId.isValid(startupId)) {
        return res.status(400).json({ message: "Invalid startup ID" });
      }
      
      const startup = await Startup.findById(startupId);
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      // Investors can see all contracts for a startup
      // Founders can only see contracts for their own startup
      if (user.role === "founder" && startup.userId.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "You don't have permission to view these contracts" });
      }
      
      const contracts = await Contract.find({ startupId }).sort({ createdAt: -1 });
      res.json(contracts);
    } catch (error) {
      log(`Get startup contracts error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to get contracts" });
    }
  });
  
  app.get("/api/contracts/investor", authenticate, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (user.role !== "investor") {
        return res.status(403).json({ message: "Only investors can access their contracts" });
      }
      
      const contracts = await Contract.find({ investorId: user._id }).sort({ createdAt: -1 });
      res.json(contracts);
    } catch (error) {
      log(`Get investor contracts error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to get contracts" });
    }
  });
  
  app.get("/api/contracts/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const contractId = req.params.id;
      const user = req.user;
      
      if (!mongoose.Types.ObjectId.isValid(contractId)) {
        return res.status(400).json({ message: "Invalid contract ID" });
      }
      
      const contract = await Contract.findById(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Only allow access to users associated with the contract
      const startup = await Startup.findById(contract.startupId);
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      const isInvestor = contract.investorId.toString() === user._id.toString();
      const isFounder = startup.userId.toString() === user._id.toString();
      
      if (!isInvestor && !isFounder) {
        return res.status(403).json({ message: "You don't have permission to view this contract" });
      }
      
      res.json(contract);
    } catch (error) {
      log(`Get contract error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to get contract" });
    }
  });
  
  app.put("/api/contracts/:id/status", authenticate, async (req: Request, res: Response) => {
    try {
      const contractId = req.params.id;
      const { status } = req.body;
      const user = req.user;
      
      if (!mongoose.Types.ObjectId.isValid(contractId)) {
        return res.status(400).json({ message: "Invalid contract ID" });
      }
      
      if (!['active', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const contract = await Contract.findById(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Only allow access to users associated with the contract
      const startup = await Startup.findById(contract.startupId);
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      const isInvestor = contract.investorId.toString() === user._id.toString();
      const isFounder = startup.userId.toString() === user._id.toString();
      
      if (!isInvestor && !isFounder) {
        return res.status(403).json({ message: "You don't have permission to update this contract" });
      }
      
      // Update the contract status
      contract.status = status;
      await contract.save();
      
      res.json(contract);
    } catch (error) {
      log(`Update contract status error: ${error}`, 'api');
      res.status(500).json({ message: "Failed to update contract status" });
    }
  });
  
  return httpServer;
}