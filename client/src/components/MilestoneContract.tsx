import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  Check, 
  Plus, 
  Trash, 
  ChevronDown, 
  ChevronUp,
  Coins
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  deployInvestmentContract,
  depositToContract,
  addMilestone,
  releaseMilestonePayment,
  getMilestones,
  getContractBalance
} from '@/lib/contracts';
import { ethToWei, weiToEth } from '@/lib/web3';
import { apiRequest } from '@/lib/queryClient';

interface Milestone {
  description: string;
  amount: string;
  isCompleted?: boolean;
}

interface MilestoneContractProps {
  startupId: number;
  startupWalletAddress: string;
  investorWalletAddress: string;
  existingContractAddress?: string;
  onContractCreated?: (contractAddress: string) => void;
  onSuccess?: () => void;
  onWalletConnect?: (address: string) => void;
}

export function MilestoneContract({
  startupId,
  startupWalletAddress,
  investorWalletAddress,
  existingContractAddress,
  onContractCreated,
  onSuccess,
  onWalletConnect
}: MilestoneContractProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([{ description: '', amount: '' }]);
  const [contractAddress, setContractAddress] = useState<string>(existingContractAddress || '');
  const [contractBalance, setContractBalance] = useState<string>('0');
  const [contractMilestones, setContractMilestones] = useState<Milestone[]>([]);
  const [totalAmount, setTotalAmount] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [expandedView, setExpandedView] = useState<boolean>(false);
  const { toast } = useToast();

  // Fetch existing contract data
  useEffect(() => {
    if (existingContractAddress) {
      setContractAddress(existingContractAddress);
      fetchContractData(existingContractAddress);
    }
  }, [existingContractAddress]);

  // Calculate total amount when milestones change
  useEffect(() => {
    const total = milestones.reduce((sum, milestone) => {
      const amount = parseFloat(milestone.amount) || 0;
      return sum + amount;
    }, 0);
    setTotalAmount(total.toString());
  }, [milestones]);

  const fetchContractData = async (address: string) => {
    try {
      setIsLoading(true);
      const balance = await getContractBalance(address);
      setContractBalance(balance);
      
      const contractMilestones = await getMilestones(address);
      setContractMilestones(contractMilestones);
    } catch (error) {
      console.error('Error fetching contract data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contract data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMilestoneChange = (index: number, field: keyof Milestone, value: string) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value };
    setMilestones(updatedMilestones);
  };

  const addMilestoneField = () => {
    setMilestones([...milestones, { description: '', amount: '' }]);
  };

  const removeMilestoneField = (index: number) => {
    if (milestones.length > 1) {
      const updatedMilestones = [...milestones];
      updatedMilestones.splice(index, 1);
      setMilestones(updatedMilestones);
    }
  };

  const deployContract = async () => {
    if (!startupWalletAddress || !investorWalletAddress) {
      toast({
        title: 'Missing wallet addresses',
        description: 'Both startup and investor must connect their wallets',
        variant: 'destructive'
      });
      return;
    }
    
    setIsDeploying(true);
    
    try {
      const address = await deployInvestmentContract(startupWalletAddress, investorWalletAddress);
      
      if (!address) {
        throw new Error('Failed to deploy contract');
      }
      
      setContractAddress(address);
      
      // Record the contract deployment in backend
      await apiRequest('/api/contracts', {
        method: 'POST',
        data: {
          startupId,
          contractAddress: address,
          investorWalletAddress,
          startupWalletAddress
        }
      });
      
      toast({
        title: 'Contract Deployed',
        description: `Smart contract successfully deployed at ${address.substring(0, 8)}...`,
        variant: 'default'
      });
      
      if (onContractCreated) {
        onContractCreated(address);
      }
      
      // Add milestones to the newly deployed contract
      for (const milestone of milestones) {
        if (milestone.description && milestone.amount) {
          const weiAmount = ethToWei(milestone.amount);
          await addMilestone(address, milestone.description, weiAmount);
        }
      }
      
      // Refresh contract data
      await fetchContractData(address);
      
    } catch (error) {
      console.error('Error deploying contract:', error);
      toast({
        title: 'Deployment Failed',
        description: 'Failed to deploy smart contract. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDeposit = async () => {
    if (!contractAddress) {
      toast({
        title: 'No Contract',
        description: 'Please deploy a contract first',
        variant: 'destructive'
      });
      return;
    }
    
    setIsDepositing(true);
    
    try {
      // Calculate total amount in wei
      const totalWei = ethToWei(totalAmount);
      
      // Deposit funds to the contract
      const success = await depositToContract(contractAddress, totalWei);
      
      if (!success) {
        throw new Error('Failed to deposit to contract');
      }
      
      // Record the transaction in backend
      await apiRequest('/api/transactions', {
        method: 'POST',
        data: {
          startupId,
          amount: Math.floor(parseFloat(totalAmount) * 100), // Store in cents
          method: 'smart_contract',
          transactionId: contractAddress,
          status: 'active'
        }
      });
      
      toast({
        title: 'Funds Deposited',
        description: `Successfully deposited ${totalAmount} ETH to the milestone contract`,
        variant: 'default'
      });
      
      // Refresh contract data
      await fetchContractData(contractAddress);
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Error depositing to contract:', error);
      toast({
        title: 'Deposit Failed',
        description: 'Failed to deposit funds to the contract. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleReleaseMilestone = async (index: number) => {
    if (!contractAddress) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Release milestone payment
      const success = await releaseMilestonePayment(contractAddress, index);
      
      if (!success) {
        throw new Error('Failed to release milestone payment');
      }
      
      toast({
        title: 'Milestone Released',
        description: `Successfully released funds for milestone ${index + 1}`,
        variant: 'default'
      });
      
      // Refresh contract data
      await fetchContractData(contractAddress);
      
    } catch (error) {
      console.error('Error releasing milestone:', error);
      toast({
        title: 'Release Failed',
        description: 'Failed to release milestone funds. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = (): number => {
    if (contractMilestones.length === 0) return 0;
    
    const completedCount = contractMilestones.filter(m => m.isCompleted).length;
    return (completedCount / contractMilestones.length) * 100;
  };

  // Calculate how much has been released vs. total
  const calculateReleasedAmount = (): string => {
    if (contractMilestones.length === 0) return '0';
    
    const releasedAmount = contractMilestones
      .filter(m => m.isCompleted)
      .reduce((sum, m) => sum + parseFloat(weiToEth(m.amount)), 0);
      
    return releasedAmount.toFixed(4);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Milestone-Based Investment</span>
          {contractAddress && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpandedView(!expandedView)}
            >
              {expandedView ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Create a smart contract with milestones to protect your investment
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!contractAddress ? (
          <>
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-700" />
              <AlertTitle className="text-blue-700">Smart Contract Protection</AlertTitle>
              <AlertDescription className="text-blue-700">
                Funds will only be released to the startup when they achieve agreed-upon milestones.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex flex-col space-y-2 p-3 border rounded-md">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Milestone {index + 1}</h4>
                    {milestones.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestoneField(index)}
                      >
                        <Trash className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Input
                      id={`description-${index}`}
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      placeholder="e.g., Launch beta version"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`amount-${index}`}>Amount (ETH)</Label>
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={milestone.amount}
                      onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                      placeholder="0.1"
                    />
                  </div>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                onClick={addMilestoneField}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center py-2">
              <span className="font-medium">Total Investment:</span>
              <span className="font-bold">{parseFloat(totalAmount).toFixed(4)} ETH</span>
            </div>
            
            <Button 
              onClick={deployContract}
              disabled={isDeploying || milestones.some(m => !m.description || !m.amount)}
              className="w-full"
            >
              {isDeploying ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deploying Contract...
                </span>
              ) : (
                <span>Deploy Smart Contract</span>
              )}
            </Button>
          </>
        ) : (
          <>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <>
                <div className="p-3 bg-primary-50 border border-primary-100 rounded-md">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Contract Address:</span>
                      <span className="text-sm font-mono">{`${contractAddress.substring(0, 6)}...${contractAddress.substring(contractAddress.length - 4)}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Contract Balance:</span>
                      <span className="text-sm font-medium">{parseFloat(weiToEth(contractBalance)).toFixed(4)} ETH</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-gray-500">Milestone Progress:</span>
                      <Progress value={calculateProgress()} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{calculateReleasedAmount()} ETH released</span>
                        <span>{contractMilestones.length} milestones</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {expandedView && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="milestones">
                      <AccordionTrigger>Milestones</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {contractMilestones.map((milestone, index) => (
                            <div 
                              key={index} 
                              className={`p-3 border rounded-md ${milestone.isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <div className="flex items-center">
                                    <h4 className="font-medium">Milestone {index + 1}</h4>
                                    {milestone.isCompleted && (
                                      <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                                        <Check className="h-3 w-3 mr-1" /> Completed
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm">{milestone.description}</p>
                                  <p className="text-sm font-medium">{parseFloat(weiToEth(milestone.amount)).toFixed(4)} ETH</p>
                                </div>
                                
                                {!milestone.isCompleted && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleReleaseMilestone(index)}
                                  >
                                    Release Funds
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                
                {parseFloat(contractBalance) === 0 && (
                  <>
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-700" />
                      <AlertTitle className="text-amber-700">Contract Needs Funding</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        Your contract has been deployed. Fund it now to secure your investment.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      onClick={handleDeposit}
                      disabled={isDepositing}
                      className="w-full"
                    >
                      {isDepositing ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Depositing...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Coins className="mr-2 h-4 w-4" />
                          Fund Contract ({parseFloat(totalAmount).toFixed(4)} ETH)
                        </span>
                      )}
                    </Button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-gray-500 flex-col items-start">
        <p>Smart contracts are deployed on the Ethereum network.</p>
        <p>Transaction fees will be applied by the network.</p>
      </CardFooter>
    </Card>
  );
}

export default MilestoneContract;