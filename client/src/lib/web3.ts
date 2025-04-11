import Web3 from 'web3';
import { apiRequest } from './queryClient';
import InvestmentContractABI from './contracts/InvestmentContractABI.json';

// Contract address (this would be set after deployment)
const INVESTMENT_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

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

// Get investment contract instance
export const getInvestmentContract = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  const { ethereum } = window as any;
  const web3 = new Web3(ethereum);
  
  return new web3.eth.Contract(
    InvestmentContractABI as any,
    INVESTMENT_CONTRACT_ADDRESS
  );
};

// Create a new investment with milestones
export const createInvestment = async (
  startupAddress: string,
  milestoneDescriptions: string[],
  milestoneAmounts: string[],
  totalAmount: string
): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  const { ethereum } = window as any;
  const web3 = new Web3(ethereum);
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  const from = accounts[0];
  
  const contract = await getInvestmentContract();
  
  // Convert string amounts to wei
  const amountsInWei = milestoneAmounts.map(amount => 
    web3.utils.toWei(amount, 'ether')
  );
  
  // Convert total amount to wei
  const totalAmountWei = web3.utils.toWei(totalAmount, 'ether');
  
  try {
    const result = await contract.methods
      .createInvestment(startupAddress, milestoneDescriptions, amountsInWei)
      .send({ from, value: totalAmountWei });
    
    return result.transactionHash;
  } catch (error) {
    console.error('Error creating investment', error);
    throw new Error('Failed to create investment');
  }
};

// Get investment details
export const getInvestmentDetails = async (investmentId: number) => {
  const contract = await getInvestmentContract();
  
  try {
    const investment = await contract.methods.getInvestment(investmentId).call();
    return {
      investor: investment.investor,
      startup: investment.startup,
      totalAmount: investment.totalAmount,
      releasedAmount: investment.releasedAmount,
      createdAt: new Date(Number(investment.createdAt) * 1000),
      status: ['Pending', 'Active', 'Completed', 'Cancelled'][investment.status],
      milestoneCount: investment.milestoneCount
    };
  } catch (error) {
    console.error('Error getting investment details', error);
    throw new Error('Failed to get investment details');
  }
};

// Get milestone details
export const getMilestoneDetails = async (investmentId: number, milestoneIndex: number) => {
  const contract = await getInvestmentContract();
  
  try {
    const milestone = await contract.methods.getMilestone(investmentId, milestoneIndex).call();
    return {
      description: milestone.description,
      amount: milestone.amount,
      released: milestone.released,
      releaseDate: milestone.releaseDate > 0 ? new Date(Number(milestone.releaseDate) * 1000) : null
    };
  } catch (error) {
    console.error('Error getting milestone details', error);
    throw new Error('Failed to get milestone details');
  }
};

// Release milestone funds
export const releaseMilestone = async (investmentId: number, milestoneIndex: number): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  const { ethereum } = window as any;
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  const from = accounts[0];
  
  const contract = await getInvestmentContract();
  
  try {
    const result = await contract.methods
      .releaseMilestone(investmentId, milestoneIndex)
      .send({ from });
    
    return result.transactionHash;
  } catch (error) {
    console.error('Error releasing milestone', error);
    throw new Error('Failed to release milestone');
  }
};

// Cancel investment
export const cancelInvestment = async (investmentId: number): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  const { ethereum } = window as any;
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  const from = accounts[0];
  
  const contract = await getInvestmentContract();
  
  try {
    const result = await contract.methods
      .cancelInvestment(investmentId)
      .send({ from });
    
    return result.transactionHash;
  } catch (error) {
    console.error('Error cancelling investment', error);
    throw new Error('Failed to cancel investment');
  }
};
