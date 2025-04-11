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
    if (!isMetaMaskInstalled()) {
      return null;
    }

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