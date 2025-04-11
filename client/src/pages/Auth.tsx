import React, { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import AuthPage from '@/components/AuthPage';
import { useAuth } from '@/lib/context/AuthContext';

const Auth: React.FC = () => {
  const { type } = useParams();
  const [location, navigate] = useLocation();
  const { isAuth, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuth) {
      // Redirect based on user role
      if (user?.role === 'founder') {
        navigate('/startup/dashboard');
      } else if (user?.role === 'investor') {
        navigate('/investor/dashboard');
      }
    }
  }, [isAuth, user, navigate]);

  // Validate auth type
  const validType = type === 'signin' || type === 'signup';
  if (!validType) {
    navigate('/auth/signin');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>
          {type === 'signin' ? 'Sign In' : 'Sign Up'} | LaunchBlocks
        </title>
      </Helmet>
      <AuthPage />
    </>
  );
};

export default Auth;
