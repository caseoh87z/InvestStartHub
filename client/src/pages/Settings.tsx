import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import NavBar from '@/components/NavBar';
import { apiRequest } from '@/lib/queryClient';

const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Define ethereum window extension
  declare global {
    interface Window {
      ethereum?: any;
    }
  }

  // Connect MetaMask wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask not detected",
        description: "Please install MetaMask extension to connect your wallet",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      // Save to backend
      const response = await apiRequest<{ success: boolean, user: any }>('/api/auth/verify-wallet', {
        method: 'POST',
        data: { walletAddress: account },
      });

      if (response && response.success) {
        setWalletAddress(account);
        updateUser({ walletAddress: account });
        toast({
          title: "Wallet connected",
          description: "Your MetaMask wallet has been connected successfully",
        });
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Connection failed",
        description: "Failed to connect your wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Change password
  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation don't match",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await apiRequest<{ success: boolean }>('/api/users/change-password', {
        method: 'POST',
        data: {
          currentPassword,
          newPassword,
        },
      });

      if (response && response.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast({
          title: "Password updated",
          description: "Your password has been updated successfully",
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "Update failed",
        description: "Failed to update your password. Please check your current password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Format wallet address for display
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <>
      <Helmet>
        <title>Account Settings | LaunchBlocks</title>
      </Helmet>
      <NavBar />
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pb-5 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">
              Account Settings
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage your account preferences and security settings
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Password Change Card */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={changePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </CardFooter>
            </Card>

            {/* Wallet Connection Card */}
            <Card>
              <CardHeader>
                <CardTitle>Wallet Connection</CardTitle>
                <CardDescription>
                  Connect your MetaMask wallet for blockchain transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-2">Connected Wallet</div>
                  <div className="font-medium">
                    {walletAddress ? (
                      <div className="flex items-center">
                        <i className="fab fa-ethereum text-purple-600 mr-2"></i>
                        <span>{formatWalletAddress(walletAddress)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No wallet connected</span>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  variant={walletAddress ? "outline" : "default"}
                >
                  {isConnecting ? 'Connecting...' : walletAddress ? 'Reconnect Wallet' : 'Connect MetaMask'}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Account Info Card */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your basic account details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <div className="mt-1 text-gray-900 font-medium">{user?.email}</div>
                  </div>
                  <Separator />
                  <div>
                    <Label>Account Type</Label>
                    <div className="mt-1 capitalize text-gray-900 font-medium">
                      {user?.role || 'User'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;