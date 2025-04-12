import Web3 from 'web3';

// Infura API key for connecting to the Ethereum Mainnet
const INFURA_API_KEY = '27c8c3b265ba4dffacb753892b605d46';
const INFURA_ENDPOINT = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;

// Initialize Web3 with Infura provider as fallback
export const getWeb3 = () => {
  if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
    // Use MetaMask provider when available
    return new Web3((window as any).ethereum);
  } else {
    // Fallback to Infura when MetaMask is not available
    return new Web3(new Web3.providers.HttpProvider(INFURA_ENDPOINT));
  }
};

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
  };
}

export const isMetaMaskInstalled = (): boolean => {
  const { ethereum } = window as Window;
  return Boolean(ethereum && ethereum.isMetaMask);
};

export const getCurrentAccount = async (): Promise<string | null> => {
  try {
    if (!isMetaMaskInstalled()) {
      console.error('MetaMask is not installed');
      return null;
    }

    const accounts = await (window as Window).ethereum!.request({
      method: 'eth_accounts',
    });
    
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

export const connectMetaMask = async (): Promise<string | null> => {
  try {
    if (!isMetaMaskInstalled()) {
      window.open('https://metamask.io/download/', '_blank');
      return null;
    }

    const accounts = await (window as Window).ethereum!.request({
      method: 'eth_requestAccounts',
    });
    
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error connecting to MetaMask:', error);
    return null;
  }
};

export const getChainId = async (): Promise<string | null> => {
  try {
    if (!isMetaMaskInstalled()) {
      return null;
    }

    const chainId = await (window as Window).ethereum!.request({
      method: 'eth_chainId',
    });
    
    return chainId;
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
};

export const sendTransaction = async (
  from: string,
  to: string,
  value: string,
): Promise<string | null> => {
  try {
    if (isMetaMaskInstalled()) {
      // Use MetaMask for transaction if available
      const transactionParameters = {
        from,
        to,
        value,
        gas: '0x5208', // 21000 in hex
      };

      const txHash = await (window as Window).ethereum!.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
      
      return txHash;
    } else {
      // Fallback to Infura when MetaMask is not available
      // Note: This requires a private key for signing transactions
      // which is not recommended in the browser for security reasons
      // This is just a placeholder to show how it could work
      console.warn('MetaMask not installed, using Infura fallback');
      
      // In a real implementation, you might handle this differently
      // such as redirecting to a server-side transaction or showing an error
      
      // Get the Web3 instance with Infura provider
      const web3 = getWeb3();
      
      // For demo purposes, we'll just log that we're attempting to use Infura
      // but return null since we can't sign transactions without a private key
      console.log('Attempted to use Infura for transaction:', {
        from,
        to,
        value,
        gas: '0x5208'
      });
      
      return null;
    }
  } catch (error) {
    console.error('Error sending transaction:', error);
    return null;
  }
};

export const listenForAccountChanges = (callback: (accounts: string[]) => void) => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  (window as Window).ethereum!.on('accountsChanged', callback);
  return () => {
    (window as Window).ethereum!.removeListener('accountsChanged', callback);
  };
};

export const listenForChainChanges = (callback: (chainId: string) => void) => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  (window as Window).ethereum!.on('chainChanged', callback);
  return () => {
    (window as Window).ethereum!.removeListener('chainChanged', callback);
  };
};

// Convert Wei to Eth (10^18 wei = 1 ETH)
export const weiToEth = (wei: string): string => {
  return (parseInt(wei, 16) / 1e18).toString();
};

// Convert Eth to Wei and return as hex
export const ethToWei = (eth: string): string => {
  return '0x' + (parseFloat(eth) * 1e18).toString(16);
};