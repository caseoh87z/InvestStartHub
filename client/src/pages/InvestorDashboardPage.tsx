import React from 'react';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';

const InvestorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  // Hardcoded startups
  const startups = [
    {
      id: 1,
      name: "EcoSolutions",
      description: "Sustainable energy solutions for residential buildings",
      industry: "Energy",
      stage: "Seed",
      totalRaised: 250000,
      investorCount: 12
    },
    {
      id: 2,
      name: "HealthTech AI",
      description: "AI-powered medical diagnosis and monitoring tools",
      industry: "Healthcare",
      stage: "Series A",
      totalRaised: 1500000,
      investorCount: 24
    },
    {
      id: 3,
      name: "EduLearn",
      description: "Personalized education platform for K-12 students",
      industry: "Education",
      stage: "Pre-seed",
      totalRaised: 75000,
      investorCount: 5
    },
    {
      id: 4,
      name: "FinTech Solutions",
      description: "Next-generation payment processing and wealth management",
      industry: "Finance",
      stage: "Series B",
      totalRaised: 8500000,
      investorCount: 38
    }
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Discover Startups
          </h1>
          <p className="mt-2 text-gray-600">
            Find and invest in promising startups from around the world.
          </p>
        </div>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {startups.map((startup) => (
            <Card key={startup.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                    {startup.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <CardTitle className="text-xl">{startup.name}</CardTitle>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {startup.stage}
                    </span>
                  </div>
                </div>
                
                <CardDescription className="text-gray-700 mb-6">
                  {startup.description}
                </CardDescription>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Total Raised</div>
                    <div className="font-semibold">{formatCurrency(startup.totalRaised)}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Industry</div>
                    <div className="font-semibold">{startup.industry}</div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button className="flex-1" onClick={() => alert(`Invest in ${startup.name}`)}>
                    Invest
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => alert(`Chat with ${startup.name}`)}>
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboardPage;
