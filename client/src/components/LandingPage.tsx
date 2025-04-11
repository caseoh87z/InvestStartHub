import React from 'react';
import { Link } from 'wouter';
import NavBar from './NavBar';
import Footer from './Footer';
import StartupCard from './StartupCard';
import { Button } from '@/components/ui/button';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <NavBar transparent={true} />

      {/* Hero Section */}
      <section className="gradient-bg text-white pt-24">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Connecting Startups with Blockchain Investors
              </h1>
              <p className="mt-6 text-xl max-w-3xl">
                A decentralized platform where founders meet investors in a secure, transparent environment. Fund and track investments using crypto or traditional payment methods.
              </p>
              <div className="mt-10 flex space-x-4">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-50">
                  <Link href="/auth/signup">
                    <a>Get Started</a>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-opacity-20 text-white hover:bg-opacity-30 border-white">
                  <Link href="#how-it-works">
                    <a>Learn More</a>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="mt-12 lg:mt-0">
              <img 
                className="rounded-lg shadow-xl" 
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80" 
                alt="Startup team working together" 
                width="600" 
                height="400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Platform Features
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Designed for both startups and investors to connect and transact with confidence
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-primary text-white mb-4">
                  <i className="fas fa-wallet text-xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Dual Payment Methods</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Invest via MetaMask (crypto) or traditional UPI payments to match your preferences.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-secondary text-white mb-4">
                  <i className="fas fa-shield-alt text-xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Secure Document Management</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Upload, store, and share crucial startup documents securely with potential investors.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-accent text-white mb-4">
                  <i className="fas fa-comments text-xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Direct Communication</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Real-time messaging between founders and investors to build relationships.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-primary text-white mb-4">
                  <i className="fas fa-chart-line text-xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Startup Analytics</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Track investments, growth metrics, and investor engagement in real-time.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-secondary text-white mb-4">
                  <i className="fas fa-search text-xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Startup Discovery</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Find promising startups filtered by industry, stage, and investment potential.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-accent text-white mb-4">
                  <i className="fas fa-history text-xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Complete record of all investments with detailed transaction information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Simple process for both startups and investors
            </p>
          </div>

          <div className="mt-16">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16">
              {/* Startup Flow */}
              <div className="rounded-lg bg-white shadow-lg overflow-hidden">
                <div className="px-6 py-8 bg-primary text-white sm:p-10 sm:pb-6">
                  <h3 className="text-2xl leading-8 font-extrabold text-white">
                    For Startup Founders
                  </h3>
                </div>
                <div className="px-6 pt-6 pb-8 sm:p-10">
                  <ul className="space-y-6">
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">1</div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg leading-6 font-medium text-gray-900">Create Your Account</h4>
                        <p className="mt-2 text-base text-gray-500">Sign up as a Startup Founder and connect your MetaMask wallet.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">2</div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg leading-6 font-medium text-gray-900">Create Your Startup Profile</h4>
                        <p className="mt-2 text-base text-gray-500">Add essential details, pitch, financial information, and UPI payment details.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">3</div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg leading-6 font-medium text-gray-900">Upload Documents</h4>
                        <p className="mt-2 text-base text-gray-500">Share pitch deck, financial reports, and investor agreements.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">4</div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg leading-6 font-medium text-gray-900">Engage With Investors</h4>
                        <p className="mt-2 text-base text-gray-500">Respond to messages and post regular updates on your progress.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">5</div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg leading-6 font-medium text-gray-900">Track Investments</h4>
                        <p className="mt-2 text-base text-gray-500">Monitor transactions and manage investor relationships through your dashboard.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Investor Flow */}
              <div className="mt-10 lg:mt-0 rounded-lg bg-white shadow-lg overflow-hidden">
                <div className="px-6 py-8 bg-accent text-white sm:p-10 sm:pb-6">
                  <h3 className="text-2xl leading-8 font-extrabold text-white">
                    For Investors
                  </h3>
                </div>
                <div className="px-6 pt-6 pb-8 sm:p-10">
                  <ul className="space-y-6">
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-white">1</div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg leading-6 font-medium text-gray-900">Create Your Account</h4>
                        <p className="mt-2 text-base text-gray-500">Sign up as an Investor and connect your MetaMask wallet for crypto investments.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-white">2</div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg leading-6 font-medium text-gray-900">Discover Startups</h4>
                        <p className="mt-2 text-base text-gray-500">Browse available startups and filter by industry, stage, or investment opportunity.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-white">3</div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg leading-6 font-medium text-gray-900">Conduct Due Diligence</h4>
                        <p className="mt-2 text-base text-gray-500">Access and review startup documents, financials, and progress updates.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-white">4</div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg leading-6 font-medium text-gray-900">Communicate Directly</h4>
                        <p className="mt-2 text-base text-gray-500">Message startup founders to ask questions and express interest.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-white">5</div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg leading-6 font-medium text-gray-900">Invest Securely</h4>
                        <p className="mt-2 text-base text-gray-500">Choose between MetaMask (crypto) or UPI (fiat) to fund startups of your choice.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Startups */}
      <section id="featured-startups" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Featured Startups
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Discover innovative companies seeking investment
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Sample Startup Cards */}
            <StartupCard 
              name="AI Analytics Pro"
              description="AI-powered analytics platform helping businesses derive actionable insights from complex data."
              logoText="AI"
              logoColor="blue"
              stage="Seed Stage"
              location="San Francisco, CA"
              tags={["AI", "Analytics", "Enterprise"]}
              raised={320000}
              goal={1200000}
              investorCount={12}
            />
            
            <StartupCard 
              name="FinTech Solutions"
              description="Blockchain-based payment system for cross-border transactions with minimal fees and instant settlement."
              logoText="FT"
              logoColor="purple"
              stage="Series A"
              location="Singapore"
              tags={["Blockchain", "Finance", "Payments"]}
              raised={1200000}
              goal={5000000}
              investorCount={28}
            />
            
            <StartupCard 
              name="GreenTech Renewables"
              description="Innovative solar energy storage solution for residential applications with IoT integration."
              logoText="GR"
              logoColor="green"
              stage="Pre-seed"
              location="Berlin, Germany"
              tags={["CleanTech", "Energy", "IoT"]}
              raised={85000}
              goal={500000}
              investorCount={5}
            />
          </div>
          
          <div className="mt-12 text-center">
            <Button asChild className="bg-accent hover:bg-purple-700">
              <Link href={"/auth/signin"}>
                <a>Explore All Startups</a>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
