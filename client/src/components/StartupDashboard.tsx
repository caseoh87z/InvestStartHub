import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MetricCard from './MetricCard';
import DocumentItem from './DocumentItem';
import StartupProfileEditor from './StartupProfileEditor';
import { DocumentUploader, type DocumentType } from './DocumentUploader';
import { QRCodeUploader } from './QRCodeUploader';
import { formatCurrency, formatDate, formatWalletAddress } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Startup {
  id: number;
  name: string;
  description: string;
  pitch: string;
  stage: string;
  industry: string;
  location: string;
  upiId: string;
  upiQrCode: string;
  walletAddress: string;
  totalRaised: number;
  totalInvestors: number;
}

interface Document {
  id: number;
  name: string;
  type: string;
  documentType: string;
  fileUrl: string;
  size: number;
  uploadedAt: string;
}

interface Transaction {
  id: number;
  startupId: number;
  investorId: number;
  investorName?: string;
  investorEmail?: string;
  amount: number;
  method: string;
  transactionId?: string;
  status: string;
  createdAt: string;
}

interface StartupDashboardProps {
  startup: Startup;
  documents: Document[];
  transactions: Transaction[];
  unreadMessages: number;
  onProfileEdit: (updatedStartup: Partial<Startup>) => void;
  onDocumentUpload: (document: File, documentType: DocumentType) => Promise<void>;
  onDocumentDelete: (documentId: number) => Promise<void>;
  onQRCodeUpload?: (qrCodeUrl: string) => Promise<void>;
}

const StartupDashboard: React.FC<StartupDashboardProps> = ({
  startup,
  documents,
  transactions,
  unreadMessages,
  onProfileEdit,
  onDocumentUpload,
  onDocumentDelete,
  onQRCodeUpload
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: startup.name,
    description: startup.description,
    pitch: startup.pitch,
    stage: startup.stage,
    industry: startup.industry,
    location: startup.location,
    upiId: startup.upiId || ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async () => {
    try {
      await onProfileEdit(editForm);
      setIsEditModalOpen(false);
      toast({
        title: "Profile updated",
        description: "Your startup profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadDocument = async (file: File, documentType: DocumentType) => {
    setIsUploading(true);
    try {
      await onDocumentUpload(file, documentType);
      toast({
        title: "Document uploaded",
        description: `Your ${documentType} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error('Document upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      await onDocumentDelete(documentId);
      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully.",
      });
    } catch (error) {
      console.error('Document deletion error:', error);
      toast({
        title: "Deletion failed",
        description: "There was an error deleting the document.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="py-10">
      <header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Startup Dashboard
            </h1>
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <i className="fas fa-check-circle mr-1"></i> Wallet Connected
              </span>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Metrics Overview */}
          <div className="px-4 sm:px-0 mt-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                icon="fas fa-dollar-sign"
                iconBgColor="primary"
                title="Total Raised"
                value={formatCurrency(startup.totalRaised)}
                linkText="View all transactions"
                linkHref="/startup/transactions"
              />
              
              <MetricCard
                icon="fas fa-users"
                iconBgColor="secondary"
                title="Total Investors"
                value={startup.totalInvestors}
                linkText="View all investors"
                linkHref="/startup/investors"
              />
              
              <MetricCard
                icon="fas fa-comments"
                iconBgColor="accent"
                title="New Messages"
                value={unreadMessages}
                linkText="View inbox"
                linkHref="/messages"
              />
            </div>
          </div>
          
          {/* Funding Analysis */}
          <div className="px-4 sm:px-0 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Funding Analysis</CardTitle>
                <CardDescription>
                  View your startup's funding progress and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Funding Progress */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Funding Progress</h3>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{formatCurrency(startup.totalRaised)} raised</span>
                      <span>Goal: {formatCurrency(startup.totalRaised * 2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${Math.min(100, (startup.totalRaised / (startup.totalRaised * 2)) * 100)}%` }}></div>
                    </div>
                    
                    {/* Recent milestones */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3 text-gray-700">Recent Funding Milestones</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                            <i className="fas fa-check"></i>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">First investor milestone reached</p>
                            <p className="text-xs text-gray-500">{formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <i className="fas fa-trophy"></i>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">25% funding goal achieved</p>
                            <p className="text-xs text-gray-500">{formatDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000))}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Funding Trend Chart */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Funding Trend</h3>
                    <div className="h-56 w-full bg-gray-50 rounded-md flex items-end p-2 space-x-1">
                      {[...Array(12)].map((_, i) => {
                        // Generate heights for demonstration
                        const height = 10 + (i * 5) + (Math.random() * 10);
                        const isLast = i === 11;
                        const month = new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'short' });
                        
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div 
                              className={`w-full ${isLast ? 'bg-primary' : 'bg-primary/60'} rounded-t`} 
                              style={{ height: `${height}%` }}
                            ></div>
                            <div className="text-xs text-gray-500 mt-1">{month}</div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Investor Distribution */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3 text-gray-700">Investor Distribution</h4>
                      <div className="flex space-x-2">
                        {/* Donut chart representation */}
                        <div className="relative w-24 h-24">
                          {/* Create segments */}
                          <div className="absolute inset-0 rounded-full border-8 border-blue-500" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 50% 100%)' }}></div>
                          <div className="absolute inset-0 rounded-full border-8 border-green-500" style={{ clipPath: 'polygon(50% 50%, 100% 100%, 0 100%, 0 50%)' }}></div>
                          <div className="absolute inset-0 rounded-full border-8 border-yellow-500" style={{ clipPath: 'polygon(50% 50%, 0 50%, 0 0, 50% 0)' }}></div>
                          <div className="absolute inset-0 rounded-full border-8 border-purple-500" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0)' }}></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-medium">{startup.totalInvestors}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                              <span className="text-xs">Angel Investors (40%)</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              <span className="text-xs">Retail Investors (30%)</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                              <span className="text-xs">Institutions (20%)</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                              <span className="text-xs">Others (10%)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Startup Profile */}
          <div className="px-4 sm:px-0 mt-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Startup Profile</CardTitle>
                  <CardDescription>
                    Your startup details and investment information.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <i className="fas fa-edit mr-2"></i>
                  Edit Profile
                </Button>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Startup Name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {startup.name}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Investment Stage
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {startup.stage}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Description
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {startup.description}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Pitch
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {startup.pitch}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      UPI ID
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {startup.upiId || "Not set"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Wallet Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 truncate">
                      {formatWalletAddress(startup.walletAddress) || "Not connected"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Document Management */}
          <div className="px-4 sm:px-0 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
                <CardDescription>
                  Manage your startup documents for investor due diligence.
                </CardDescription>
              </CardHeader>
              <div className="border-t border-gray-200">
                <div className="px-4 py-4">
                  {documents.length > 0 ? (
                    <div className="space-y-6">
                      {/* Group documents by type */}
                      {(() => {
                        const groupedDocs: Record<string, any[]> = {};
                        documents.forEach((doc) => {
                          const type = doc.documentType || 'Other';
                          if (!groupedDocs[type]) groupedDocs[type] = [];
                          groupedDocs[type].push(doc);
                        });
                        
                        return Object.entries(groupedDocs).map(([type, docs]) => (
                          <div key={type} className="border rounded-lg p-4">
                            <h3 className="font-medium text-gray-900 mb-3">{type}</h3>
                            <ul className="divide-y divide-gray-200">
                              {docs.map((doc: any) => (
                                <DocumentItem
                                  key={doc.id}
                                  id={doc.id}
                                  name={doc.name}
                                  type={doc.type}
                                  documentType={doc.documentType || 'Other'}
                                  fileUrl={doc.fileUrl}
                                  size={doc.size}
                                  uploadedAt={doc.uploadedAt}
                                  onDelete={handleDeleteDocument}
                                  canDelete={true}
                                />
                              ))}
                            </ul>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No documents uploaded yet. Upload your first document to share with investors.
                    </div>
                  )}
                </div>
                <div className="px-4 py-4 sm:px-6">
                  <Button 
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Upload New Document
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Transactions */}
          <div className="px-4 sm:px-0 mt-8 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    Latest investments received for your startup.
                  </CardDescription>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => navigate('/startup/transactions')}
                  className="text-primary hover:text-blue-500"
                >
                  View all
                </Button>
              </CardHeader>
              <div className="border-t border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Investor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.length > 0 ? (
                        transactions.slice(0, 3).map((tx) => (
                          <tr key={tx.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {tx.investorName ? tx.investorName.substring(0, 2).toUpperCase() : 'IN'}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {tx.investorName || "Anonymous Investor"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {tx.investorEmail || ""}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatCurrency(tx.amount)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {tx.method === 'metamask' ? (
                                  <><i className="fab fa-ethereum text-purple-600 mr-1"></i> MetaMask</>
                                ) : (
                                  <><i className="fas fa-money-bill-wave text-green-600 mr-1"></i> UPI</>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(tx.createdAt)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                                tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No transactions yet. Share your startup profile with potential investors.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Startup Profile</DialogTitle>
            <DialogDescription>
              Update your startup information. This will be visible to potential investors.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stage" className="text-right">
                Stage
              </Label>
              <select
                id="stage"
                name="stage"
                value={editForm.stage}
                onChange={handleEditChange}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Pre-seed">Pre-seed</option>
                <option value="Seed">Seed</option>
                <option value="Series A">Series A</option>
                <option value="Series B">Series B</option>
                <option value="Series C+">Series C+</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="industry" className="text-right">
                Industry
              </Label>
              <select
                id="industry"
                name="industry"
                value={editForm.industry}
                onChange={handleEditChange}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Energy">Energy</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Transportation">Transportation</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={editForm.location}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="upiId" className="text-right">
                UPI ID
              </Label>
              <Input
                id="upiId"
                name="upiId"
                value={editForm.upiId}
                onChange={handleEditChange}
                className="col-span-3"
                placeholder="yourname@upi"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="upiQrCode" className="text-right pt-2">
                UPI QR Code
              </Label>
              <div className="col-span-3">
                <QRCodeUploader
                  initialImage={startup.upiQrCode}
                  onImageUpload={(imageUrl) => {
                    if (onQRCodeUpload) {
                      onQRCodeUpload(imageUrl);
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Drag and drop or click to upload your UPI QR code. This will be visible to investors.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <textarea
                id="description"
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                rows={3}
                className="col-span-3 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pitch" className="text-right">
                Pitch
              </Label>
              <textarea
                id="pitch"
                name="pitch"
                value={editForm.pitch}
                onChange={handleEditChange}
                rows={2}
                className="col-span-3 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal */}
      <DocumentUploader 
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onUpload={handleUploadDocument}
      />
    </div>
  );
};

export default StartupDashboard;
