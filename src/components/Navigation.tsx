import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Settings,
  FileText,
  Lock,
  Menu,
  X,
} from 'lucide-react';

type NavigationItem = {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: {
    resource: string;
    action: string;
  };
};

interface NavigationProps {
  canAccessTab: (tab: string) => boolean;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    requiredPermission: { resource: 'dashboard', action: 'read' }
  },
  {
    id: 'income',
    path: '/income',
    label: 'Income',
    icon: TrendingUp,
    requiredPermission: { resource: 'income', action: 'write' }
  },
  {
    id: 'expenses',
    path: '/expenses',
    label: 'Expenses',
    icon: TrendingDown,
    requiredPermission: { resource: 'expenses', action: 'write' }
  },
  {
    id: 'accounts',
    path: '/accounts',
    label: 'Accounts',
    icon: Wallet,
    requiredPermission: { resource: 'accounts', action: 'read' }
  },
  {
    id: 'reports',
    path: '/reports',
    label: 'Reports',
    icon: FileText,
    requiredPermission: { resource: 'reports', action: 'read' }
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    requiredPermission: { resource: 'settings', action: 'read' }
  },
];

export const Navigation: React.FC<NavigationProps> = ({ canAccessTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false); // Close mobile menu when link is clicked
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex bg-white shadow-sm border-r border-gray-100 w-64 min-h-screen flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <img
              src="/digitum_finance.png"
              alt="Digitum Finance"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Digitum</h1>
              <p className="text-sm text-gray-500">Finance Manager</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 pb-6">
          {navigationItems.map((item) => {
            const hasAccess = canAccessTab(item.id);

            if (!hasAccess) {
              return (
                <div
                  key={item.id}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 mb-1 text-gray-400 cursor-not-allowed opacity-50"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  <Lock className="w-3 h-3 text-gray-400 ml-auto" />
                </div>
              );
            }

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 mb-1 ${
                    isActive
                      ? 'bg-green-50 text-green-700 font-medium border-r-2 border-green-500 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-green-600' : ''}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Security Footer */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            <span>Secured with RBAC</span>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className={`lg:hidden fixed top-0 left-0 h-full w-80 bg-white shadow-xl border-r border-gray-100 z-40 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 pt-16">
          <div className="flex items-center space-x-3">
            <img
              src="/digitum_finance.png"
              alt="Digitum Finance"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Digitum</h1>
              <p className="text-sm text-gray-500">Finance Manager</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 pb-6">
          {navigationItems.map((item) => {
            const hasAccess = canAccessTab(item.id);

            if (!hasAccess) {
              return (
                <div
                  key={item.id}
                  className="w-full flex items-center space-x-3 px-3 py-4 rounded-lg text-left transition-all duration-200 mb-1 text-gray-400 cursor-not-allowed opacity-50"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-base">{item.label}</span>
                  <Lock className="w-3 h-3 text-gray-400 ml-auto" />
                </div>
              );
            }

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-4 rounded-lg text-left transition-all duration-200 mb-1 ${
                    isActive
                      ? 'bg-green-50 text-green-700 font-medium border-r-2 border-green-500 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-green-600' : ''}`} />
                    <span className="text-base">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Security Footer */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            <span>Secured with RBAC</span>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center justify-around py-2">
          {navigationItems.slice(0, 5).map((item) => {
            const hasAccess = canAccessTab(item.id);

            if (!hasAccess) {
              return (
                <div
                  key={item.id}
                  className="flex flex-col items-center justify-center p-2 min-w-0 flex-1 text-gray-400 opacity-50 relative"
                >
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs truncate">{item.label}</span>
                  <Lock className="w-2 h-2 absolute top-1 right-1" />
                </div>
              );
            }

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center p-2 min-w-0 flex-1 ${
                    isActive ? 'text-green-600' : 'text-gray-600'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
};