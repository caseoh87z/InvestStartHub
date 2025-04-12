import React from 'react';
import { Link } from 'wouter';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center">
              <i className="fas fa-cubes text-accent text-2xl mr-2"></i>
              <span className="text-xl font-bold">LaunchBlocks</span>
            </div>
            <p className="mt-4 text-gray-300">
              Connecting innovative startups with forward-thinking investors through blockchain technology.
            </p>
            <div className="mt-4 flex space-x-6">
              <a href="https://twitter.com" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter text-xl"></i>
                <span className="sr-only">Twitter</span>
              </a>
              <a href="https://linkedin.com" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-linkedin text-xl"></i>
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="https://github.com" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-github text-xl"></i>
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Resources</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/documentation" className="text-base text-gray-300 hover:text-white">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/guides" className="text-base text-gray-300 hover:text-white">
                  Guides
                </Link>
              </li>
              <li>
                <Link href="/api-status" className="text-base text-gray-300 hover:text-white">
                  API Status
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/about" className="text-base text-gray-300 hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-base text-gray-300 hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-base text-gray-300 hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-base text-gray-300 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 text-center">
            &copy; {new Date().getFullYear()} LaunchBlocks. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
