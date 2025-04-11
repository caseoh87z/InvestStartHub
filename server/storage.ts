import { 
  users, type User, type InsertUser,
  startups, type Startup, type InsertStartup,
  documents, type Document, type InsertDocument,
  transactions, type Transaction, type InsertTransaction,
  messages, type Message, type InsertMessage
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Startups
  getStartup(id: number): Promise<Startup | undefined>;
  getStartupByUserId(userId: number): Promise<Startup | undefined>;
  getAllStartups(): Promise<Startup[]>;
  createStartup(startup: InsertStartup): Promise<Startup>;
  updateStartup(id: number, startup: Partial<Startup>): Promise<Startup | undefined>;
  
  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByStartupId(startupId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Transactions
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByStartupId(startupId: number): Promise<Transaction[]>;
  getTransactionsByInvestorId(investorId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined>;
  
  // Messages
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  getUnreadMessagesByUserId(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private startups: Map<number, Startup>;
  private documents: Map<number, Document>;
  private transactions: Map<number, Transaction>;
  private messages: Map<number, Message>;
  
  private userIdCounter: number;
  private startupIdCounter: number;
  private documentIdCounter: number;
  private transactionIdCounter: number;
  private messageIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.startups = new Map();
    this.documents = new Map();
    this.transactions = new Map();
    this.messages = new Map();
    
    this.userIdCounter = 1;
    this.startupIdCounter = 1;
    this.documentIdCounter = 1;
    this.transactionIdCounter = 1;
    this.messageIdCounter = 1;
  }
  
  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.walletAddress === walletAddress);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { 
      ...user, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  // Startups
  async getStartup(id: number): Promise<Startup | undefined> {
    return this.startups.get(id);
  }
  
  async getStartupByUserId(userId: number): Promise<Startup | undefined> {
    return Array.from(this.startups.values()).find(startup => startup.userId === userId);
  }
  
  async getAllStartups(): Promise<Startup[]> {
    return Array.from(this.startups.values());
  }
  
  async createStartup(startup: InsertStartup): Promise<Startup> {
    const id = this.startupIdCounter++;
    const newStartup: Startup = { 
      ...startup, 
      id, 
      totalRaised: 0,
      totalInvestors: 0,
      createdAt: new Date()
    };
    this.startups.set(id, newStartup);
    return newStartup;
  }
  
  async updateStartup(id: number, startupData: Partial<Startup>): Promise<Startup | undefined> {
    const startup = this.startups.get(id);
    if (!startup) return undefined;
    
    const updatedStartup = { ...startup, ...startupData };
    this.startups.set(id, updatedStartup);
    return updatedStartup;
  }
  
  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async getDocumentsByStartupId(startupId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.startupId === startupId);
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const newDocument: Document = { 
      ...document, 
      id, 
      uploadedAt: new Date()
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }
  
  // Transactions
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async getTransactionsByStartupId(startupId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.startupId === startupId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getTransactionsByInvestorId(investorId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.investorId === investorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const newTransaction: Transaction = { 
      ...transaction, 
      id, 
      createdAt: new Date()
    };
    this.transactions.set(id, newTransaction);
    
    // Update startup totals if transaction is completed
    if (transaction.status === 'completed') {
      const startup = await this.getStartup(transaction.startupId);
      if (startup) {
        const investors = new Set(
          (await this.getTransactionsByStartupId(transaction.startupId))
            .filter(tx => tx.status === 'completed')
            .map(tx => tx.investorId)
        );
        
        await this.updateStartup(transaction.startupId, {
          totalRaised: (startup.totalRaised || 0) + transaction.amount,
          totalInvestors: investors.size
        });
      }
    }
    
    return newTransaction;
  }
  
  async updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, status };
    this.transactions.set(id, updatedTransaction);
    
    // Update startup totals if transaction becomes completed
    if (status === 'completed' && transaction.status !== 'completed') {
      const startup = await this.getStartup(transaction.startupId);
      if (startup) {
        const investors = new Set(
          (await this.getTransactionsByStartupId(transaction.startupId))
            .filter(tx => tx.status === 'completed')
            .map(tx => tx.investorId)
        );
        
        await this.updateStartup(transaction.startupId, {
          totalRaised: (startup.totalRaised || 0) + transaction.amount,
          totalInvestors: investors.size
        });
      }
    }
    
    return updatedTransaction;
  }
  
  // Messages
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === userId1 && msg.receiverId === userId2) || 
        (msg.senderId === userId2 && msg.receiverId === userId1)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getUnreadMessagesByUserId(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.receiverId === userId && !msg.read)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const newMessage: Message = { 
      ...message, 
      id, 
      read: false,
      createdAt: new Date()
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, read: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
}

export const storage = new MemStorage();
