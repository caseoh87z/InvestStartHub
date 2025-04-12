import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import { getIndustries, getInvestmentStages, getLocations, getNameInitials, isValidUpiId } from '@/lib/utils';

// Interfaces
interface Startup {
  id: number;
  name: string;
  description: string;
  pitch: string;
  stage: string;
  industry: string;
  location: string;
  upiId?: string;
  upiQrCode?: string;
  walletAddress?: string;
  totalRaised: number;
  totalInvestors: number;
}

interface StartupProfileEditorProps {
  open: boolean;
  onClose: () => void;
  startup: Startup;
  onSave: (updatedStartup: Partial<Startup>) => Promise<void>;
}

const StartupProfileEditor: React.FC<StartupProfileEditorProps> = ({
  open,
  onClose,
  startup,
  onSave
}) => {
  // Form state
  const [activeTab, setActiveTab] = useState("basics");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upiError, setUpiError] = useState('');
  const { toast } = useToast();
  
  // Form data
  const [form, setForm] = useState({
    name: startup.name,
    description: startup.description,
    pitch: startup.pitch,
    stage: startup.stage,
    industry: startup.industry,
    location: startup.location,
    upiId: startup.upiId || ''
  });
  
  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validate UPI ID if that field is being edited
    if (name === 'upiId' && value) {
      if (!isValidUpiId(value)) {
        setUpiError('Please enter a valid UPI ID (format: username@bank)');
      } else {
        setUpiError('');
      }
    }
    
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Calculate form completion percentage
  const calculateProgress = () => {
    const requiredFields = ['name', 'description', 'pitch', 'stage', 'industry', 'location'];
    const filledFields = requiredFields.filter(field => Boolean(form[field as keyof typeof form]));
    return (filledFields.length / requiredFields.length) * 100;
  };
  
  // Submit form
  const handleSubmit = async () => {
    // Validate required fields
    if (!form.name || !form.description || !form.stage || !form.industry || !form.location) {
      toast({
        title: "Incomplete form",
        description: "Please fill all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate UPI if provided
    if (form.upiId && !isValidUpiId(form.upiId)) {
      setActiveTab("payments");
      toast({
        title: "Invalid UPI ID",
        description: "Please enter a valid UPI ID or leave it empty.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onSave(form);
      toast({
        title: "Profile updated",
        description: "Your startup profile has been updated successfully."
      });
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Startup Profile</DialogTitle>
          <DialogDescription>
            Update your startup information to attract potential investors.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <Progress value={calculateProgress()} className="h-2 mb-1" />
          <div className="text-xs text-gray-500 text-right">
            Profile completion: {Math.round(calculateProgress())}%
          </div>
        </div>
        
        <div className="flex gap-4 mt-2">
          <div className="w-1/3">
            {/* Startup preview card */}
            <Card className="mb-4 sticky top-4">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarFallback className="text-2xl bg-primary text-white">
                      {getNameInitials(form.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold mb-1 text-center">{form.name || "Your Startup"}</h3>
                  <div className="text-sm mb-3 text-center">
                    {form.industry} • {form.location}
                  </div>
                  <div className="text-sm text-gray-700 mb-4 text-center">
                    {form.stage || "Investment Stage"}
                  </div>
                  <div className="text-sm text-gray-600 mb-4 text-center line-clamp-4">
                    {form.description || "Add a description to showcase your startup."}
                  </div>
                  {form.upiId && (
                    <div className="text-xs bg-blue-50 p-2 rounded text-blue-700 w-full text-center">
                      UPI Payments Enabled
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="w-2/3">
            <Tabs defaultValue="basics" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="basics">Basic Info</TabsTrigger>
                <TabsTrigger value="description">Description & Pitch</TabsTrigger>
                <TabsTrigger value="payments">Payment Options</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basics" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Startup Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your startup's name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stage">Investment Stage *</Label>
                  <select
                    id="stage"
                    name="stage"
                    value={form.stage}
                    onChange={handleChange}
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Select a stage</option>
                    {getInvestmentStages().map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <select
                    id="industry"
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Select an industry</option>
                    {getIndustries().map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <select
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select a location</option>
                    {getLocations().map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                
                <div className="pt-4 text-right">
                  <Button onClick={() => setActiveTab("description")}>
                    Next: Description & Pitch <i className="fas fa-arrow-right ml-2"></i>
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="description" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description * <span className="text-gray-500 text-xs">(Brief overview of your startup)</span>
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Describe your startup in a few sentences..."
                    required
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {form.description.length} / 500 characters
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pitch">
                    Elevator Pitch * <span className="text-gray-500 text-xs">(Compelling one-liner)</span>
                  </Label>
                  <textarea
                    id="pitch"
                    name="pitch"
                    value={form.pitch}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="What makes your startup unique in one sentence..."
                    required
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {form.pitch.length} / 140 characters
                  </div>
                </div>
                
                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("basics")}>
                    <i className="fas fa-arrow-left mr-2"></i> Back
                  </Button>
                  <Button onClick={() => setActiveTab("payments")}>
                    Next: Payment Options <i className="fas fa-arrow-right ml-2"></i>
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="payments" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Connected Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    value={startup.walletAddress || ''}
                    className="bg-gray-50"
                    readOnly
                  />
                  <div className="text-xs text-gray-500">
                    This is your connected blockchain wallet address. To change it, use the wallet connection feature.
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID (Optional)</Label>
                  <Input
                    id="upiId"
                    name="upiId"
                    value={form.upiId}
                    onChange={handleChange}
                    placeholder="yourname@bank"
                  />
                  {upiError && (
                    <div className="text-sm text-red-500">{upiError}</div>
                  )}
                  <div className="text-xs text-gray-500">
                    Add your UPI ID to enable direct UPI payments from investors.
                  </div>
                </div>
                
                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("description")}>
                    <i className="fas fa-arrow-left mr-2"></i> Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Profile'} <i className="fas fa-check ml-2"></i>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartupProfileEditor;