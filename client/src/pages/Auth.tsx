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
        
        // Check for saved redirect URL after login
        const savedRedirect = localStorage.getItem('redirectAfterLogin');
        
        if (savedRedirect) {
          console.log("Auth page - redirecting to saved URL:", savedRedirect);
          // Clear the saved redirect to prevent future unexpected redirects
          localStorage.removeItem('redirectAfterLogin');
          window.location.href = savedRedirect;
        } else {
          // Normal role-based redirect
          const role = payload.role;
          console.log("Auth page - user already authenticated, role:", role);
          
          // If founder, check if they have a startup first
          if (role === 'founder') {
            const userId = payload.userId;
            console.log("Auth page - checking if founder has startup");
            
            // Make API call to check if founder has a startup
            fetch(`/api/startups/user/${userId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            .then(response => {
              if (response.status === 404) {
                // No startup found, redirect to create page
                console.log("Auth page - no startup found, redirecting to create page");
                sessionStorage.removeItem('startup_created');
                navigate('/startup/create');
              } else if (response.ok) {
                // Startup found, redirect to dashboard
                console.log("Auth page - startup found, redirecting to dashboard");
                sessionStorage.setItem('startup_created', 'true');
                navigate('/startup/dashboard');
              } else {
                // Error handling
                console.error("Auth page - error checking startup status");
                navigate('/startup/dashboard'); // Default to dashboard on error
              }
            })
            .catch(error => {
              console.error("Auth page - error fetching startup:", error);
              navigate('/startup/dashboard'); // Default to dashboard on error
            });
          } else {
            // For investors, just navigate to dashboard
            navigate('/investor/dashboard');
          }
        }
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
