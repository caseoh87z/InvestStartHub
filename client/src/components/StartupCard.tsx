import React from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'wouter';

interface StartupCardProps {
  id?: number;
  name: string;
  description: string;
  logoText: string;
  logoColor: string;
  stage: string;
  location: string;
  tags: string[];
  raised: number;
  goal?: number;
  investorCount: number;
  onInvestClick?: () => void;
  onChatClick?: () => void;
  showActions?: boolean;
}

const StartupCard: React.FC<StartupCardProps> = ({
  id,
  name,
  description,
  logoText,
  logoColor,
  stage,
  location,
  tags,
  raised,
  goal,
  investorCount,
  onInvestClick,
  onChatClick,
  showActions = true
}) => {
  // Determine the color class based on the logoColor prop
  let logoColorClass = 'bg-blue-100 text-blue-600';
  
  if (logoColor === 'purple') {
    logoColorClass = 'bg-purple-100 text-purple-600';
  } else if (logoColor === 'green') {
    logoColorClass = 'bg-green-100 text-green-600';
  }
  
  // Calculate the stage badge color
  let stageBadgeClass = 'bg-blue-100 text-blue-800';
  
  if (stage.toLowerCase().includes('series a')) {
    stageBadgeClass = 'bg-green-100 text-green-800';
  } else if (stage.toLowerCase().includes('pre-seed')) {
    stageBadgeClass = 'bg-purple-100 text-purple-800';
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 h-12 w-12 ${logoColorClass} rounded-full flex items-center justify-center`}>
            <span className="text-lg font-bold">{logoText}</span>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageBadgeClass}`}>
              {stage}
            </span>
          </div>
        </div>
        
        <p className="mt-4 text-gray-600">
          {description}
        </p>
        
        <div className="mt-6">
          <div className="flex items-center text-sm text-gray-500">
            <i className="fas fa-map-marker-alt mr-2"></i>
            <span>{location}</span>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <i className="fas fa-tag mr-2"></i>
            <span>{tags.join(', ')}</span>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <i className="fas fa-dollar-sign mr-2"></i>
            <span>{formatCurrency(raised)}{goal ? ` / ${formatCurrency(goal)} raised` : ' raised'}</span>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <i className="fas fa-users mr-2"></i>
            <span>{investorCount} Investors</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">Documents</h4>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div 
              className="flex items-center px-3 py-2 text-xs text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer"
              onClick={() => onInvestClick && onInvestClick()}
            >
              <i className="fas fa-file-pdf text-red-500 mr-2"></i>
              Pitch Deck
            </div>
            <div 
              className="flex items-center px-3 py-2 text-xs text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer"
              onClick={() => onInvestClick && onInvestClick()}
            >
              <i className="fas fa-file-excel text-green-500 mr-2"></i>
              Financials
            </div>
          </div>
        </div>

        {showActions && (
          <div className="mt-6 flex space-x-3">
            {id ? (
              <>
                <Button 
                  className="flex-1 flex items-center justify-center bg-primary hover:bg-blue-700"
                  onClick={onInvestClick}
                >
                  <i className="fas fa-dollar-sign mr-2"></i>
                  Invest
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 flex items-center justify-center"
                  onClick={() => {
                    // We need to use window.location.href to ensure a full page navigation
                    // This is a protected route so the auth check should work correctly
                    window.location.href = `/startup/details/${id}`;
                  }}
                >
                  <i className="fas fa-eye mr-2"></i>
                  Details
                </Button>
              </>
            ) : (
              <Button 
                className="flex-1 flex items-center justify-center bg-primary hover:bg-blue-700"
                onClick={() => window.location.href = '/auth/signin'}
              >
                <i className="fas fa-eye mr-2"></i>
                View Details
              </Button>
            )}
            
            {onChatClick && (
              <Button 
                variant="outline"
                className="flex-1 flex items-center justify-center"
                onClick={onChatClick}
              >
                <i className="fas fa-comments mr-2"></i>
                Chat
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StartupCard;
