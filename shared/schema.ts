import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  role: true,
  walletAddress: true,
});

// Startup schema
export const startups = pgTable("startups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pitch: text("pitch").notNull(),
  stage: text("stage").notNull(),
  industry: text("industry").notNull(),
  location: text("location").notNull(),
  upiId: text("upi_id"),
  upiQrCode: text("upi_qr_code"),
  totalRaised: integer("total_raised").default(0),
  totalInvestors: integer("total_investors").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStartupSchema = createInsertSchema(startups).pick({
  userId: true,
  name: true,
  description: true,
  pitch: true,
  stage: true,
  industry: true,
  location: true,
  upiId: true,
  upiQrCode: true,
});

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").notNull().references(() => startups.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // file type (pdf, docx, etc.)
  documentType: text("document_type").notNull(), // Pitch Deck, Financial Report, etc.
  fileUrl: text("file_url").notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  startupId: true,
  name: true,
  type: true,
  documentType: true,
  fileUrl: true,
  size: true,
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").notNull().references(() => startups.id),
  investorId: integer("investor_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  method: text("method").notNull(), // "metamask" or "upi"
  transactionId: text("transaction_id"), // blockchain tx or UPI tx
  status: text("status").notNull(), // "pending", "completed", "failed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  startupId: true,
  investorId: true,
  amount: true,
  method: true,
  transactionId: true,
  status: true,
});

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Startup = typeof startups.$inferSelect;
export type InsertStartup = z.infer<typeof insertStartupSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
