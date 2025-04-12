import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Wallet, Coins } from 'lucide-react';

interface WalletConnectProps {
  walletAddress?: string;
  onConnect: (address: string) => void;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function WalletConnect({ walletAddress, onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Check if MetaMask is available
    const checkMetaMask = () => {
      if (window.ethereum) {
        setIsMetaMaskAvailable(true);
      } else {
        setIsMetaMaskAvailable(false);
      }
    };

    checkMetaMask();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          onConnect(accounts[0]);
        }
      });
    }

    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {
          console.log('accountsChanged event removed');
        });
      }
    };
  }, [onConnect]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Available",
        description: "Please install MetaMask browser extension to connect your wallet.",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        const address = accounts[0];
        onConnect(address);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        });
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to MetaMask",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const displayWalletAddress = walletAddress 
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : undefined;

  return (
    <div className="flex flex-col space-y-4">
      {!isMetaMaskAvailable && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-sm">
          <p>
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-amber-600 font-medium hover:underline"
            >
              Install MetaMask
            </a> to connect your wallet and make crypto investments.
          </p>
        </div>
      )}

      {walletAddress ? (
        <div className="flex items-center space-x-2 bg-primary-50 border border-primary-100 rounded-lg p-3">
          <Wallet className="h-5 w-5 text-primary" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">Connected Wallet</span>
            <span className="text-xs text-gray-600">{displayWalletAddress}</span>
          </div>
        </div>
      ) : (
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting || !isMetaMaskAvailable}
          className="flex items-center"
        >
          {isConnecting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            <span className="flex items-center">
              <Coins className="mr-2 h-4 w-4" />
              Connect MetaMask
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

export default WalletConnect;