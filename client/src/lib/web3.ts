import Web3 from 'web3';
import { apiRequest } from './queryClient';

// Check if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  const { ethereum } = window as any;
  return Boolean(ethereum && ethereum.isMetaMask);
};

// Request account access
export const connectWallet = async (): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  const { ethereum } = window as any;
  
  try {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  } catch (error) {
    console.error('Error connecting to MetaMask', error);
    throw new Error('Failed to connect to MetaMask');
  }
};

// Get current account
export const getCurrentAccount = async (): Promise<string | null> => {
  if (!isMetaMaskInstalled()) {
    return null;
  }
  
  const { ethereum } = window as any;
  
  try {
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting accounts', error);
    return null;
  }
};

// Send Ethereum transaction
export const sendTransaction = async (to: string, amount: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  const { ethereum } = window as any;
  const web3 = new Web3(ethereum);
  
  try {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];
    
    // Convert amount to wei
    const amountWei = web3.utils.toWei(amount, 'ether');
    
    // Send transaction
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to,
        value: web3.utils.toHex(amountWei),
      }],
    });
    
    return txHash;
  } catch (error) {
    console.error('Error sending transaction', error);
    throw new Error('Failed to send transaction');
  }
};

// Verify wallet connection to backend
export const verifyWalletWithBackend = async (walletAddress: string, userId?: number): Promise<any> => {
  try {
    const payload = userId ? { walletAddress, userId } : { walletAddress };
    const response = await apiRequest('POST', '/api/auth/verify-wallet', payload);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying wallet with backend', error);
    throw error;
  }
};

// Setup wallet change listener
export const setupWalletListener = (callback: (accounts: string[]) => void): void => {
  if (!isMetaMaskInstalled()) {
    return;
  }
  
  const { ethereum } = window as any;
  
  ethereum.on('accountsChanged', callback);
};
