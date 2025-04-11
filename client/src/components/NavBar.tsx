import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Menu } from "lucide-react";
import { getNameInitials } from '@/lib/utils';

interface NavBarProps {
  transparent?: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ transparent = false }) => {
  const { user, isAuth, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`${transparent ? 'bg-transparent absolute w-full z-10' : 'bg-white shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <i className="fas fa-cubes text-accent text-2xl mr-2"></i>
                <span className={`text-xl font-bold ${transparent ? 'text-white' : 'text-gray-900'}`}>LaunchBlocks</span>
            </div>
            
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <div 
                className={`${transparent ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-medium cursor-pointer`}
                onClick={() => navigate('/#features')}
              >
                Features
              </div>
              <div 
                className={`${transparent ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-medium cursor-pointer`}
                onClick={() => navigate('/#how-it-works')}
              >
                How It Works
              </div>
              <div 
                className={`${transparent ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-medium cursor-pointer`}
                onClick={() => navigate('/#featured-startups')}
              >
                Featured Startups
              </div>
            </nav>
          </div>
          
          <div className="flex items-center">
            {isAuth ? (
              <>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Bell className="h-5 w-5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getNameInitials(user?.email || '')}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {user?.role === 'founder' ? (
                      <DropdownMenuItem onClick={() => navigate('/startup/dashboard')}>
                        Startup Dashboard
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => navigate('/investor/dashboard')}>
                        Investor Dashboard
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={() => navigate('/messages')}>
                      Messages
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => 
                      navigate(user?.role === 'founder' ? '/startup/transactions' : '/investor/transactions')
                    }>
                      Transactions
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <div 
                  className={`${transparent ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-medium cursor-pointer`}
                  onClick={() => navigate('/auth/signin')}
                >
                  Sign In
                </div>
                <div 
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 cursor-pointer"
                  onClick={() => navigate('/auth/signup')}
                >
                  Sign Up
                </div>
              </>
            )}
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden ml-4">
              <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <div
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate('/#features')}
              >
                Features
              </div>
              <div
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate('/#how-it-works')}
              >
                How It Works
              </div>
              <div
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate('/#featured-startups')}
              >
                Featured Startups
              </div>
              
              {isAuth ? (
                <>
                  {user?.role === 'founder' ? (
                    <div
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate('/startup/dashboard')}
                    >
                      Startup Dashboard
                    </div>
                  ) : (
                    <div
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate('/investor/dashboard')}
                    >
                      Investor Dashboard
                    </div>
                  )}
                  <div
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate('/messages')}
                  >
                    Messages
                  </div>
                  <div
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                    onClick={handleLogout}
                  >
                    Log out
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate('/auth/signin')}
                  >
                    Sign In
                  </div>
                  <div
                    className="block px-3 py-2 rounded-md text-base font-medium text-primary hover:text-blue-700 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate('/auth/signup')}
                  >
                    Sign Up
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default NavBar;
