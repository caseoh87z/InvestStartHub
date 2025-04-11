import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { sendTransaction, isMetaMaskInstalled } from '@/lib/web3';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/utils';

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
  const [paymentMethod, setPaymentMethod] = useState<'metamask' | 'upi'>('metamask');
  const [amount, setAmount] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [metaMaskAvailable, setMetaMaskAvailable] = useState<boolean>(true);
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
    }
  }, [open]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const handleConfirm = async () => {
    if (!startup) return;
    
    // Validate amount
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
        
        // Ethereum transaction
        const txHash = await sendTransaction(startup.walletAddress, amount);
        
        // Record transaction in backend
        await apiRequest('POST', '/api/transactions', {
          startupId: startup.id,
          amount: Math.floor(amountNum * 100), // Convert to cents
          method: 'metamask',
          transactionId: txHash,
          status: 'completed'
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
        await apiRequest('POST', '/api/transactions', {
          startupId: startup.id,
          amount: Math.floor(amountNum * 100), // Convert to cents
          method: 'upi',
          transactionId: transactionId,
          status: 'pending' // UPI transactions need verification
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
          <div className="space-y-4">
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(value) => setPaymentMethod(value as 'metamask' | 'upi')}
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
            
            {paymentMethod === 'metamask' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Make sure your MetaMask wallet is connected to proceed with the crypto transaction.
                </p>
                <Alert variant="warning">
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
