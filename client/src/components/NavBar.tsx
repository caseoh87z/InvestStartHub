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
            <Link href="/">
              <a className="flex-shrink-0 flex items-center">
                <i className="fas fa-cubes text-accent text-2xl mr-2"></i>
                <span className={`text-xl font-bold ${transparent ? 'text-white' : 'text-gray-900'}`}>LaunchBlocks</span>
              </a>
            </Link>
            
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/#features">
                <a className={`${transparent ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}>
                  Features
                </a>
              </Link>
              <Link href="/#how-it-works">
                <a className={`${transparent ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}>
                  How It Works
                </a>
              </Link>
              <Link href="/#featured-startups">
                <a className={`${transparent ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}>
                  Featured Startups
                </a>
              </Link>
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
                <Link href="/auth/signin">
                  <a className={`${transparent ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}>
                    Sign In
                  </a>
                </Link>
                <Link href="/auth/signup">
                  <a className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700">
                    Sign Up
                  </a>
                </Link>
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
              <Link href="/#features">
                <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Features</a>
              </Link>
              <Link href="/#how-it-works">
                <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">How It Works</a>
              </Link>
              <Link href="/#featured-startups">
                <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Featured Startups</a>
              </Link>
              
              {isAuth ? (
                <>
                  {user?.role === 'founder' ? (
                    <Link href="/startup/dashboard">
                      <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Startup Dashboard</a>
                    </Link>
                  ) : (
                    <Link href="/investor/dashboard">
                      <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Investor Dashboard</a>
                    </Link>
                  )}
                  <Link href="/messages">
                    <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Messages</a>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Sign In</a>
                  </Link>
                  <Link href="/auth/signup">
                    <a className="block px-3 py-2 rounded-md text-base font-medium text-primary hover:text-blue-700 hover:bg-gray-50">Sign Up</a>
                  </Link>
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
