import React, { useState } from 'react';
import { Link } from 'wouter';
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
  onDocumentUpload: (document: File) => Promise<void>;
  onDocumentDelete: (documentId: number) => Promise<void>;
}

const StartupDashboard: React.FC<StartupDashboardProps> = ({
  startup,
  documents,
  transactions,
  unreadMessages,
  onProfileEdit,
  onDocumentUpload,
  onDocumentDelete
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

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await onDocumentUpload(selectedFile);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully.",
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
                <ul className="divide-y divide-gray-200">
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <DocumentItem
                        key={doc.id}
                        id={doc.id}
                        name={doc.name}
                        type={doc.type}
                        fileUrl={doc.fileUrl}
                        size={doc.size}
                        uploadedAt={doc.uploadedAt}
                        onDelete={handleDeleteDocument}
                      />
                    ))
                  ) : (
                    <li className="px-4 py-8 text-center text-gray-500">
                      No documents uploaded yet. Upload your first document to share with investors.
                    </li>
                  )}
                </ul>
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
                <Link href="/startup/transactions">
                  <a className="text-sm font-medium text-primary hover:text-blue-500">
                    View all
                  </a>
                </Link>
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
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload documents to share with potential investors.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <Label htmlFor="document">Select Document</Label>
              <Input
                id="document"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
              />
              {selectedFile && (
                <p className="text-sm text-gray-500">
                  Selected file: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUploadDocument} disabled={!selectedFile || isUploading}>
              {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StartupDashboard;
