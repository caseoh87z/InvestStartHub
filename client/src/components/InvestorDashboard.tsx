import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StartupCard from './StartupCard';
import InvestmentModal from './InvestmentModal';
import { getIndustries, getInvestmentStages, getLocations } from '@/lib/utils';

interface Startup {
  id: number;
  name: string;
  description: string;
  pitch: string;
  stage: string;
  industry: string;
  location: string;
  upiId?: string;
  upiQrCode?: string;
  walletAddress?: string;
  totalRaised: number;
  totalInvestors: number;
}

interface InvestorDashboardProps {
  startups: Startup[];
  onInvest: () => void;
  onChatWithFounder: (startupId: number) => void;
}

const InvestorDashboard: React.FC<InvestorDashboardProps> = ({
  startups,
  onInvest,
  onChatWithFounder
}) => {
  const [filters, setFilters] = useState({
    industry: '',
    stage: '',
    location: '',
    search: ''
  });
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };

  const handleInvestClick = (startup: Startup) => {
    setSelectedStartup(startup);
    setIsInvestmentModalOpen(true);
  };

  const handleChatClick = (startupId: number) => {
    onChatWithFounder(startupId);
  };

  const handleInvestmentSuccess = () => {
    onInvest();
  };

  // Filter startups based on selected filters
  const filteredStartups = startups.filter(startup => {
    if (filters.industry && startup.industry !== filters.industry) return false;
    if (filters.stage && startup.stage !== filters.stage) return false;
    if (filters.location && startup.location !== filters.location) return false;
    if (filters.search && !startup.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !startup.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Get lists for filters
  const industries = getIndustries();
  const stages = getInvestmentStages();
  const locations = getLocations();

  return (
    <div className="py-10">
      <header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Discover Startups
            </h1>
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <i className="fas fa-check-circle mr-1"></i> Wallet Connected
              </span>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="px-4 sm:px-0 mt-8">
            <Card className="bg-white shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                  <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 flex-1">
                    <div className="w-full sm:w-1/3">
                      <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                      <Input
                        id="search"
                        placeholder="Search startups..."
                        value={filters.search}
                        onChange={handleSearchChange}
                      />
                    </div>
                    <div className="w-full sm:w-1/3">
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                      <Select
                        value={filters.industry}
                        onValueChange={(value) => handleFilterChange('industry', value)}
                      >
                        <SelectTrigger id="industry">
                          <SelectValue placeholder="All Industries" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Industries</SelectItem>
                          {industries.map(industry => (
                            <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full sm:w-1/3">
                      <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                      <Select
                        value={filters.stage}
                        onValueChange={(value) => handleFilterChange('stage', value)}
                      >
                        <SelectTrigger id="stage">
                          <SelectValue placeholder="All Stages" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Stages</SelectItem>
                          {stages.map(stage => (
                            <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-end w-full sm:w-auto mt-4 sm:mt-0">
                    <Button 
                      className="w-full bg-accent hover:bg-purple-700"
                      onClick={() => setFilters({ industry: '', stage: '', location: '', search: '' })}
                    >
                      <i className="fas fa-filter mr-2"></i>
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Startup Listings */}
          <div className="px-4 sm:px-0 mt-8">
            {filteredStartups.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredStartups.map(startup => (
                  <StartupCard
                    key={startup.id}
                    id={startup.id}
                    name={startup.name}
                    description={startup.description}
                    logoText={startup.name.substring(0, 2).toUpperCase()}
                    logoColor={
                      startup.stage.toLowerCase().includes('pre-seed') ? 'purple' :
                      startup.stage.toLowerCase().includes('seed') ? 'blue' : 'green'
                    }
                    stage={startup.stage}
                    location={startup.location}
                    tags={[startup.industry]}
                    raised={startup.totalRaised}
                    investorCount={startup.totalInvestors}
                    onInvestClick={() => handleInvestClick(startup)}
                    onChatClick={() => handleChatClick(startup.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-white shadow">
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center">
                    <i className="fas fa-search text-4xl text-gray-400 mb-4"></i>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No startups found</h3>
                    <p className="text-gray-500">
                      No startups match your current filter criteria. Try adjusting your filters or check back later for new listings.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Investment Modal */}
      <InvestmentModal
        open={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        startup={selectedStartup}
        onSuccess={handleInvestmentSuccess}
      />
    </div>
  );
};

export default InvestorDashboard;
