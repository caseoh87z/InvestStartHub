import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import WalletConnect from './WalletConnect';
import { 
  isMetaMaskInstalled, 
  getWeb3, 
  sendTransaction as sendWeb3Transaction,
  ethToWei 
} from '@/lib/web3';

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
  const [etherscanUrl, setEtherscanUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Initialize Web3 with Infura
  const web3 = getWeb3();
  
  // Get current network for Etherscan link
  useEffect(() => {
    const getNetworkInfo = async () => {
      try {
        if (isMetaMaskInstalled()) {
          const networkId = await web3.eth.net.getId();
          let etherscanBase = 'https://etherscan.io';
          
          // Convert BigInt to Number for comparison if needed
          const networkIdNum = Number(networkId);
          
          // Set Etherscan URL based on network
          if (networkIdNum === 3) {
            etherscanBase = 'https://ropsten.etherscan.io';
          } else if (networkIdNum === 4) {
            etherscanBase = 'https://rinkeby.etherscan.io';
          } else if (networkIdNum === 5) {
            etherscanBase = 'https://goerli.etherscan.io';
          } else if (networkIdNum === 42) {
            etherscanBase = 'https://kovan.etherscan.io';
          }
          
          setEtherscanUrl(etherscanBase);
        } else {
          // Fallback to mainnet if MetaMask is not installed
          setEtherscanUrl('https://etherscan.io');
        }
      } catch (error) {
        console.error('Error getting network information:', error);
        // Fallback to mainnet
        setEtherscanUrl('https://etherscan.io');
      }
    };
    
    getNetworkInfo();
  }, []);

  const sendTransaction = async () => {
    if (!isMetaMaskInstalled()) {
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

    // Convert amount to Wei
    const weiAmount = ethToWei(amount);
    
    setIsProcessing(true);

    try {
      // Use our enhanced web3 transaction function
      const txHash = await sendWeb3Transaction(
        walletAddress,
        startupWalletAddress,
        weiAmount
      );
      
      if (!txHash) {
        throw new Error("Transaction failed or was rejected");
      }

      // Handle successful transaction
      toast({
        title: "Transaction Sent",
        description: "Your investment transaction has been submitted to the blockchain.",
      });
      
      // Store the transaction hash for Etherscan link
      if (etherscanUrl) {
        setEtherscanUrl(`${etherscanUrl}/tx/${txHash}`);
      }

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

      {!isMetaMaskInstalled() && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Improved Ethereum Connectivity</AlertTitle>
          <AlertDescription>
            Using Infura API for Ethereum Mainnet connectivity. For the best experience, we recommend installing MetaMask.
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.open('https://metamask.io/download/', '_blank')}
          >
            <span className="flex items-center">
              <ExternalLink className="mr-2 h-4 w-4" />
              Install MetaMask
            </span>
          </Button>
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

      {etherscanUrl && etherscanUrl.includes('/tx/') && (
        <Alert className="bg-green-50 text-green-800 border-green-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Transaction Submitted</AlertTitle>
          <AlertDescription className="flex flex-col">
            <span>Your transaction has been submitted to the blockchain.</span>
            <a 
              href={etherscanUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mt-1 inline-flex items-center"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View on Etherscan
            </a>
          </AlertDescription>
        </Alert>
      )}

      {walletAddress && startupWalletAddress && (
        <div className="text-xs text-gray-500 pt-2">
          <p>You will be asked to confirm this transaction in the MetaMask popup.</p>
          <p>Transaction fees will be added by the Ethereum network.</p>
          <p className="mt-1">Powered by Infura API for reliable Ethereum connectivity.</p>
        </div>
      )}
    </div>
  );
}

export default CryptoPayment;