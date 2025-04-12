import React, { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import AuthPage from '@/components/AuthPage';
import { useAuth } from '@/lib/context/AuthContext';

const Auth: React.FC = () => {
  const { type } = useParams();
  const [location, navigate] = useLocation();
  const { isAuth, user, authInitialized } = useAuth();

  // Redirect if already authenticated, but only after auth state is fully initialized
  useEffect(() => {
    console.log("Auth page - auth state:", { isAuth, user, authInitialized });
    if (authInitialized && isAuth && user) {
      console.log("Auth page - user already authenticated, redirecting to dashboard");
      // Redirect based on user role
      const targetUrl = user.role === 'founder' ? '/startup/dashboard' : '/investor/dashboard';
      navigate(targetUrl);
    }
  }, [isAuth, user, authInitialized, navigate]);

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
