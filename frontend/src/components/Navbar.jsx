import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, QrCode } from 'lucide-react';
import FPO_logo from '../assets/FPO_logo.png'

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo - Left Side */}
          <div className="flex items-center">
            <Link 
                to="/" 
                className="flex items-center" 
            >
                <img 
                    src={FPO_logo} 
                    alt="FPO Archive Logo" 
                    className="h-10 w-auto" 
                />
            </Link>
          </div>
          
          {/* Navigation Links - Center */}
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <Home size={20} />
              <span className="font-medium">Dashboard</span>
            </Link>
            
            <Link 
              to="/add" 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/add') 
                  ? 'bg-green-100 text-green-600 shadow-sm' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
              }`}
            >
              <Plus size={20} />
              <span className="font-medium">Add Document</span>
            </Link>
            
            <Link 
              to="/scanner" 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/scanner') 
                  ? 'bg-purple-100 text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
              }`}
            >
              <QrCode size={20} />
              <span className="font-medium">QR Scanner</span>
            </Link>
          </div>
          
          {/* Right Side - Could add user menu later */}
          <div className="flex items-center">
            <div className="text-sm text-gray-500">
              Archive System
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;