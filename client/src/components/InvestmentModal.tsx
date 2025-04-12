import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  isMetaMaskInstalled, 
  connectMetaMask, 
  sendTransaction, 
  ethToWei 
} from '@/lib/web3';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, MinusCircle, CheckCircle } from 'lucide-react';
import CryptoPayment from './CryptoPayment';
import UpiPayment from './UpiPayment';
import MilestoneContract from './MilestoneContract';

interface Milestone {
  description: string;
  amount: string;
}

interface InvestmentModalProps {
  open: boolean;
  onClose: () => void;
  startup: {
    id: number;
    name: string;
    upiId?: string;
    upiQrCode?: string;
    walletAddress?: string;
  } | null;
  onSuccess: () => void;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({
  open,
  onClose,
  startup,
  onSuccess
}) => {
  const [investmentType, setInvestmentType] = useState<'direct' | 'milestone'>('direct');
  const [paymentMethod, setPaymentMethod] = useState<'metamask' | 'upi'>('metamask');
  const [amount, setAmount] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [metaMaskAvailable, setMetaMaskAvailable] = useState<boolean>(true);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [milestones, setMilestones] = useState<Milestone[]>([
    { description: "Initial funding", amount: "" }
  ]);
  const { toast } = useToast();

  useEffect(() => {
    setMetaMaskAvailable(isMetaMaskInstalled());
  }, []);

  useEffect(() => {
    // Reset form when modal opens
    if (open) {
      setAmount('');
      setTransactionId('');
      setPaymentMethod('metamask');
      setInvestmentType('direct');
      setMilestones([{ description: "Initial funding", amount: "" }]);
    }
  }, [open]);

  // Handle milestone input changes
  const handleMilestoneChange = (index: number, field: keyof Milestone, value: string) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value
    };
    setMilestones(updatedMilestones);
  };

  // Add a new milestone
  const addMilestone = () => {
    setMilestones([...milestones, { description: "", amount: "" }]);
  };

  // Remove a milestone
  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    const updatedMilestones = milestones.filter((_, i) => i !== index);
    setMilestones(updatedMilestones);
  };

  // Calculate total milestone amount
  const totalMilestoneAmount = milestones.reduce((sum, milestone) => {
    const amount = parseFloat(milestone.amount) || 0;
    return sum + amount;
  }, 0);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const handleConfirm = async () => {
    if (!startup) return;
    
    if (investmentType === 'direct') {
      // Validate amount for direct investment
      const amountNum = parseFloat(amount);
      if (!amount || isNaN(amountNum) || amountNum <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid investment amount.",
          variant: "destructive",
        });
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Handle payment based on selected method
        if (paymentMethod === 'metamask') {
          if (!startup.walletAddress) {
            toast({
              title: "Error",
              description: "This startup hasn't set up a wallet address yet.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          
          // First connect to MetaMask
          const account = await connectMetaMask();
          
          if (!account) {
            toast({
              title: "Wallet connection failed",
              description: "Failed to connect to MetaMask. Please make sure it's installed and unlocked.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          
          // Convert USD amount to ETH (simplified conversion for demo)
          // In a real app, you'd use an oracle or price feed
          const ethAmount = (parseFloat(amount) / 2000).toString(); // Assuming 1 ETH = $2000
          
          // Convert ETH to Wei for the transaction
          const weiAmount = ethToWei(ethAmount);
          
          // Send Ethereum transaction
          const txHash = await sendTransaction(account, startup.walletAddress!, weiAmount);
          
          if (!txHash) {
            toast({
              title: "Transaction failed",
              description: "The transaction was rejected or failed. Please try again.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          
          // Record transaction in backend
          await apiRequest('/api/transactions', {
            method: 'POST',
            data: {
              startupId: startup.id,
              amount: Math.floor(amountNum * 100), // Convert to cents
              method: 'metamask',
              transactionId: txHash,
              status: 'completed'
            }
          });
          
          toast({
            title: "Investment successful!",
            description: `You have successfully invested ${formatCurrency(amountNum)} in ${startup.name}.`,
            variant: "default",
          });
          
          onSuccess();
          onClose();
        } else {
          // UPI transaction
          if (!transactionId) {
            toast({
              title: "Transaction ID required",
              description: "Please enter the transaction ID from your UPI payment.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          
          // Record transaction in backend
          await apiRequest('/api/transactions', {
            method: 'POST',
            data: {
              startupId: startup.id,
              amount: Math.floor(amountNum * 100), // Convert to cents
              method: 'upi',
              transactionId: transactionId,
              status: 'pending' // UPI transactions need verification
            }
          });
          
          toast({
            title: "Investment recorded",
            description: `Your investment of ${formatCurrency(amountNum)} in ${startup.name} has been recorded and is pending verification.`,
            variant: "default",
          });
          
          onSuccess();
          onClose();
        }
      } catch (error) {
        console.error('Investment error:', error);
        toast({
          title: "Investment failed",
          description: "There was an error processing your investment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Milestone-based investment (only available with MetaMask)
      
      // Validate milestones
      const invalidMilestones = milestones.filter(
        m => !m.description || !m.amount || isNaN(parseFloat(m.amount)) || parseFloat(m.amount) <= 0
      );
      
      if (invalidMilestones.length > 0) {
        toast({
          title: "Invalid milestones",
          description: "Please make sure all milestones have a description and valid amount.",
          variant: "destructive",
        });
        return;
      }
      
      if (totalMilestoneAmount <= 0) {
        toast({
          title: "Invalid total amount",
          description: "Total investment amount must be greater than zero.",
          variant: "destructive",
        });
        return;
      }
      
      if (!startup.walletAddress) {
        toast({
          title: "Error",
          description: "This startup hasn't set up a wallet address yet.",
          variant: "destructive",
        });
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Prepare milestone data for smart contract
        const milestoneDescriptions = milestones.map(m => m.description);
        const milestoneAmounts = milestones.map(m => m.amount);
        
        // First connect to MetaMask
        const account = await connectMetaMask();
        
        if (!account) {
          toast({
            title: "Wallet connection failed",
            description: "Failed to connect to MetaMask. Please make sure it's installed and unlocked.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        // In a real application, you would deploy and interact with a smart contract
        // For now, we'll just create a regular transaction and mark it as milestone-based
        
        // Convert USD amount to ETH (simplified conversion for demo)
        const ethAmount = (totalMilestoneAmount / 2000).toString(); // Assuming 1 ETH = $2000
        
        // Convert ETH to Wei for the transaction
        const weiAmount = ethToWei(ethAmount);
        
        // Send Ethereum transaction for the total amount
        const txHash = await sendTransaction(account, startup.walletAddress, weiAmount);
        
        // Record transaction in backend
        await apiRequest('/api/transactions', {
          method: 'POST',
          data: {
            startupId: startup.id,
            amount: Math.floor(totalMilestoneAmount * 100), // Convert to cents
            method: 'smart_contract',
            transactionId: txHash,
            status: 'active' // Smart contract transactions start as active
          }
        });
        
        toast({
          title: "Milestone investment created!",
          description: `You have successfully created a milestone-based investment of ${formatCurrency(totalMilestoneAmount)} in ${startup.name}.`,
          variant: "default",
        });
        
        onSuccess();
        onClose();
      } catch (error) {
        console.error('Milestone investment error:', error);
        toast({
          title: "Investment failed",
          description: "There was an error processing your milestone-based investment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!startup) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invest in {startup.name}</DialogTitle>
          <DialogDescription>
            Choose your preferred investment method and enter the amount you wish to invest.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-6">
            {/* Investment Type */}
            <div className="space-y-2">
              <Label>Investment Type</Label>
              <Tabs 
                defaultValue="direct" 
                value={investmentType}
                onValueChange={(value) => setInvestmentType(value as 'direct' | 'milestone')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="direct">Direct Investment</TabsTrigger>
                  <TabsTrigger value="milestone" disabled={paymentMethod === 'upi'}>Milestone-Based</TabsTrigger>
                </TabsList>
                <TabsContent value="direct">
                  <p className="text-sm text-gray-500 mt-2 mb-4">
                    Send a one-time investment directly to the startup.
                  </p>
                  
                  {paymentMethod === 'metamask' ? (
                    <CryptoPayment
                      startupId={startup.id}
                      walletAddress={undefined} // This will be set when user connects wallet
                      startupWalletAddress={startup.walletAddress}
                      onSuccess={(txHash, amount) => {
                        // Record transaction in backend
                        apiRequest('/api/transactions', {
                          method: 'POST',
                          data: {
                            startupId: startup.id,
                            amount: Math.floor(amount * 100), // Convert to cents
                            method: 'metamask',
                            transactionId: txHash,
                            status: 'completed'
                          }
                        }).then(() => {
                          toast({
                            title: "Investment successful!",
                            description: `You have successfully invested ${amount} ETH in ${startup.name}.`,
                          });
                          
                          onSuccess();
                          onClose();
                        }).catch((error) => {
                          console.error('Investment error:', error);
                          toast({
                            title: "Transaction Recording Failed",
                            description: "Your payment was processed but we couldn't record it in our system. Please contact support.",
                            variant: "destructive"
                          });
                        });
                      }}
                      onWalletConnect={(address) => {
                        console.log("Wallet connected:", address);
                      }}
                    />
                  ) : (
                    <UpiPayment
                      startupId={startup.id}
                      upiId={startup.upiId}
                      upiQrCode={startup.upiQrCode}
                      onSuccess={(transactionId, amount) => {
                        // Record transaction in backend
                        apiRequest('/api/transactions', {
                          method: 'POST',
                          data: {
                            startupId: startup.id,
                            amount: Math.floor(amount * 100), // Convert to cents
                            method: 'upi',
                            transactionId: transactionId,
                            status: 'pending' // UPI transactions need verification
                          }
                        }).then(() => {
                          toast({
                            title: "Investment recorded",
                            description: `Your investment of ${amount} INR in ${startup.name} has been recorded and is pending verification.`,
                          });
                          
                          onSuccess();
                          onClose();
                        }).catch((error) => {
                          console.error('Investment error:', error);
                          toast({
                            title: "Transaction Recording Failed",
                            description: "We couldn't record your payment in our system. Please contact support.",
                            variant: "destructive"
                          });
                        });
                      }}
                    />
                  )}
                </TabsContent>
                <TabsContent value="milestone">
                  <p className="text-sm text-gray-500 mt-2 mb-4">
                    Release funds gradually as the startup achieves agreed-upon milestones.
                    Only available with MetaMask.
                  </p>
                  
                  <MilestoneContract 
                    startupId={startup.id}
                    startupWalletAddress={startup.walletAddress || ''}
                    investorWalletAddress={walletAddress}
                    onContractCreated={(contractAddress) => {
                      console.log("Contract deployed at:", contractAddress);
                      
                      // Record the contract in the backend
                      apiRequest('/api/contracts', {
                        method: 'POST',
                        data: {
                          startupId: startup.id,
                          contractAddress,
                          startupWalletAddress: startup.walletAddress,
                          investorWalletAddress: walletAddress
                        }
                      }).catch(err => {
                        console.error("Failed to record contract:", err);
                      });
                      
                      toast({
                        title: "Smart Contract Deployed",
                        description: "Your milestone-based investment contract has been deployed successfully.",
                      });
                    }}
                    onSuccess={() => {
                      toast({
                        title: "Contract Funded",
                        description: `Your milestone-based investment in ${startup.name} has been set up successfully.`,
                      });
                      onSuccess();
                      onClose();
                    }}
                    onWalletConnect={(address) => {
                      setWalletAddress(address);
                      console.log("Wallet connected for milestone contract:", address);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(value) => {
                  setPaymentMethod(value as 'metamask' | 'upi');
                  if (value === 'upi' && investmentType === 'milestone') {
                    setInvestmentType('direct');
                  }
                }}
                className="flex flex-col space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="metamask" 
                    id="metamask" 
                    disabled={!metaMaskAvailable} 
                  />
                  <Label htmlFor="metamask" className="flex items-center text-sm font-medium text-gray-700">
                    <i className="fab fa-ethereum text-purple-600 mr-2 text-lg"></i>
                    MetaMask (Crypto)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upi" id="upi" disabled={!startup.upiId} />
                  <Label htmlFor="upi" className="flex items-center text-sm font-medium text-gray-700">
                    <i className="fas fa-money-bill-wave text-green-600 mr-2 text-lg"></i>
                    UPI (Fiat)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Investment Amount or Milestones */}
            {investmentType === 'direct' ? (
              <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="pl-7 pr-12"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">USD</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Milestones</Label>
                  <span className="text-sm text-gray-500">
                    Total: ${totalMilestoneAmount.toFixed(2)}
                  </span>
                </div>
                
                {milestones.map((milestone, index) => (
                  <div key={index} className="space-y-2 p-3 border rounded-md relative">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium">Milestone {index + 1}</h4>
                      {milestones.length > 1 && (
                        <Button
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeMilestone(index)}
                          className="h-5 w-5 absolute right-2 top-2"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`milestone-${index}-desc`}>Description</Label>
                        <Input
                          id={`milestone-${index}-desc`}
                          value={milestone.description}
                          onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                          placeholder="Describe the milestone"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`milestone-${index}-amount`}>Amount</Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <Input
                            id={`milestone-${index}-amount`}
                            value={milestone.amount}
                            onChange={(e) => handleMilestoneChange(
                              index, 
                              'amount', 
                              e.target.value.replace(/[^0-9.]/g, '')
                            )}
                            placeholder="0.00"
                            className="pl-7"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addMilestone}
                  className="w-full"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>
            )}
            
            {paymentMethod === 'metamask' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Make sure your MetaMask wallet is connected to proceed with the crypto transaction.
                </p>
                <Alert>
                  <AlertDescription>
                    You'll be asked to confirm this transaction in your MetaMask wallet. Gas fees will apply.
                  </AlertDescription>
                </Alert>
                
                {!metaMaskAvailable && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      MetaMask is not installed. Please install the MetaMask browser extension to use this payment method.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            {paymentMethod === 'upi' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Scan the QR code below to complete the UPI payment:
                </p>
                <div className="flex justify-center">
                  <div className="bg-white p-2 border border-gray-300 rounded-md">
                    {startup.upiQrCode ? (
                      <img src={startup.upiQrCode} alt="UPI QR Code" className="h-48 w-48" />
                    ) : (
                      <div className="h-48 w-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">UPI ID: {startup.upiId || 'Not available'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="transaction-id">
                    Enter Transaction ID after payment
                  </Label>
                  <Input
                    id="transaction-id"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter UPI Transaction ID"
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading || (paymentMethod === 'metamask' && !metaMaskAvailable)}
          >
            {isLoading ? 'Processing...' : 'Confirm Investment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentModal;
