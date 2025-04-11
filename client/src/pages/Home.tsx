import React from 'react';
import { Helmet } from 'react-helmet';
import LandingPage from '@/components/LandingPage';

const Home: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>LaunchBlocks - Decentralized Startup Investment Platform</title>
        <meta name="description" content="Connect startup founders with investors in a secure and transparent environment through blockchain technology." />
      </Helmet>
      <LandingPage />
    </>
  );
};

export default Home;
