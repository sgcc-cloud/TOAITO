import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ListBulletIcon } from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'History', path: '/history', icon: ListBulletIcon },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-purple-700 p-4 py-5 shadow-xl backdrop-blur-md bg-opacity-80 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-wide">TOAITO</span>
            <span className="hidden sm:inline-block text-lg text-white/80 ml-2">Lottery Analyst</span>
          </Link>
          <nav className="flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={location.pathname === item.path ? 'page' : undefined}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                  ${location.pathname === item.path ? 'bg-white/20 text-white shadow-inner' : 'text-white hover:bg-white/10'}`}
              >
                <item.icon className="h-5 w-5 mr-1" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content with backdrop blur for card effects */}
      <main className="flex-grow container mx-auto px-4 py-6 md:py-10 backdrop-blur-sm">
        {children}
      </main>

      {/* Footer (optional, could be a persistent action bar instead for this app) */}
      {/* <footer className="bg-gray-800 text-gray-400 p-4 text-center text-sm">
        © 2024 TOAITO. All rights reserved.
      </footer> */}
    </div>
  );
};

export default Layout;