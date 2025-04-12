import React, { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import AuthPage from '@/components/AuthPage';

const Auth: React.FC = () => {
  const { type } = useParams();
  const [location, navigate] = useLocation();

  // Simple redirect if there's a token
  useEffect(() => {
    console.log("Auth page - checking for token");
    const token = localStorage.getItem('token');
    
    if (token) {
      console.log("Auth page - token found, decoding role");
      
      try {
        // Get role from token
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(
          decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
        );
        
        // Redirect based on user role if found in token
        const role = payload.role;
        console.log("Auth page - user already authenticated, role:", role);
        
        const targetUrl = role === 'founder' ? '/startup/dashboard' : '/investor/dashboard';
        navigate(targetUrl);
      } catch (e) {
        console.error("Error decoding token:", e);
        // If we can't decode the token, still allow access to auth page
      }
    }
  }, [navigate]);

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
