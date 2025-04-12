import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import WalletConnect from './WalletConnect';

interface CryptoPaymentProps {
  startupId: number;
  walletAddress?: string;
  startupWalletAddress?: string;
  onSuccess: (txHash: string, amount: number) => void;
  onWalletConnect: (address: string) => void;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function CryptoPayment({ 
  startupId, 
  walletAddress, 
  startupWalletAddress, 
  onSuccess, 
  onWalletConnect 
}: CryptoPaymentProps) {
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const sendTransaction = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Available",
        description: "Please install MetaMask browser extension to make a payment.",
        variant: "destructive"
      });
      return;
    }

    if (!walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet first.",
        variant: "destructive"
      });
      return;
    }

    if (!startupWalletAddress) {
      toast({
        title: "Startup Wallet Not Available",
        description: "This startup has not provided a wallet address for receiving funds.",
        variant: "destructive"
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to invest.",
        variant: "destructive"
      });
      return;
    }

    // Convert amount to Wei (1 ETH = 10^18 Wei)
    const amountInWei = (parseFloat(amount) * 1e18).toString(16);
    
    setIsProcessing(true);

    try {
      // Send transaction
      const transactionParameters = {
        to: startupWalletAddress,
        from: walletAddress,
        value: '0x' + amountInWei,
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      // Handle successful transaction
      toast({
        title: "Transaction Sent",
        description: "Your investment transaction has been submitted to the blockchain.",
      });

      // Call onSuccess with transaction hash and amount
      onSuccess(txHash, parseFloat(amount));
    } catch (error: any) {
      console.error('Error sending transaction:', error);
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to send transaction",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!walletAddress && (
        <div className="mb-4">
          <WalletConnect 
            walletAddress={walletAddress} 
            onConnect={onWalletConnect} 
          />
        </div>
      )}

      {!startupWalletAddress && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Available</AlertTitle>
          <AlertDescription>
            This startup has not provided a wallet address to receive cryptocurrency payments.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Investment Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.1"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isProcessing || !walletAddress || !startupWalletAddress}
          />
        </div>

        <Button
          onClick={sendTransaction}
          disabled={isProcessing || !walletAddress || !startupWalletAddress || !amount || parseFloat(amount) <= 0}
          className="w-full"
        >
          {isProcessing ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center">
              <Coins className="mr-2 h-4 w-4" />
              Send ETH Investment
            </span>
          )}
        </Button>
      </div>

      {walletAddress && startupWalletAddress && (
        <div className="text-xs text-gray-500 pt-2">
          <p>You will be asked to confirm this transaction in the MetaMask popup.</p>
          <p>Transaction fees will be added by the Ethereum network.</p>
        </div>
      )}
    </div>
  );
}

export default CryptoPayment;