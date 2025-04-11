import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
  id: number;
  startupId: number;
  startupName?: string;
  investorId: number;
  amount: number;
  method: string;
  transactionId?: string;
  status: string;
  createdAt: string;
}

interface Startup {
  id: number;
  name: string;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let badgeClass = '';
  
  switch (status) {
    case 'completed':
      badgeClass = 'bg-green-100 text-green-800 hover:bg-green-200';
      break;
    case 'pending':
      badgeClass = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      break;
    case 'failed':
      badgeClass = 'bg-red-100 text-red-800 hover:bg-red-200';
      break;
    default:
      badgeClass = 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
  
  return (
    <Badge className={badgeClass} variant="outline">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const InvestorTransactions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    method: ''
  });

  // Fetch all startups for name lookup
  const { 
    data: startups = [], 
    isLoading: startupsLoading 
  } = useQuery({
    queryKey: ['/api/startups'],
    queryFn: async () => {
      const res = await fetch('/api/startups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch startups');
      }
      return res.json();
    }
  });

  // Fetch transactions
  const { 
    data: transactions = [], 
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['/api/transactions/investor'],
    queryFn: async () => {
      const res = await fetch('/api/transactions/investor', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return res.json();
    }
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Enhance transactions with startup names
  const enhancedTransactions = transactions.map(tx => {
    const startup = startups.find(s => s.id === tx.startupId);
    return {
      ...tx,
      startupName: startup?.name || `Startup #${tx.startupId}`
    };
  });

  const filteredTransactions = enhancedTransactions.filter(tx => {
    // Apply status filter
    if (filters.status && tx.status !== filters.status) return false;
    
    // Apply method filter
    if (filters.method && tx.method !== filters.method) return false;
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const startupName = tx.startupName?.toLowerCase() || '';
      const txId = tx.transactionId?.toLowerCase() || '';
      
      if (!startupName.includes(searchTerm) && 
          !txId.includes(searchTerm) &&
          !tx.amount.toString().includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });

  // Loading state
  if (transactionsLoading || startupsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (transactionsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Transactions</h2>
              <p className="text-gray-500 mb-4">There was an error loading your transactions. Please try again.</p>
              <Button onClick={() => refetchTransactions()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>My Investments | LaunchBlocks</title>
      </Helmet>
      <NavBar />
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Investments
              </h1>
              <p className="text-gray-500 mt-1">
                Track all your startup investments
              </p>
            </div>
            <Button onClick={() => navigate('/investor/dashboard')}>
              Discover Startups
            </Button>
          </header>
          
          <main className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Investment History</CardTitle>
                <CardDescription>
                  View all your investments across startups.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by startup name or transaction ID"
                      value={filters.search}
                      onChange={handleSearch}
                    />
                  </div>
                  <div className="flex gap-4">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={filters.method}
                      onChange={(e) => handleFilterChange('method', e.target.value)}
                    >
                      <option value="">All Methods</option>
                      <option value="metamask">MetaMask</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                </div>
                
                <div className="overflow-x-auto border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Startup
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(tx.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {tx.startupName ? tx.startupName.substring(0, 2).toUpperCase() : 'ST'}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {tx.startupName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(tx.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {tx.method === 'metamask' ? (
                                <span className="flex items-center">
                                  <i className="fab fa-ethereum text-purple-600 mr-1"></i> MetaMask
                                  {tx.transactionId && (
                                    <span className="ml-1 text-xs text-gray-500">
                                      ({tx.transactionId.substring(0, 6)}...{tx.transactionId.substring(tx.transactionId.length - 4)})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <i className="fas fa-money-bill-wave text-green-600 mr-1"></i> UPI
                                  {tx.transactionId && (
                                    <span className="ml-1 text-xs text-gray-500">
                                      (ID: {tx.transactionId})
                                    </span>
                                  )}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={tx.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate(`/messages?userId=${tx.startupId}`)}
                              >
                                <i className="fas fa-comment mr-1"></i>
                                Contact
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                            {transactions.length === 0 ? 
                              "You haven't made any investments yet. Discover startups to start investing." : 
                              "No transactions match your filters."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

export default InvestorTransactions;
