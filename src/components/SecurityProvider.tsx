import React, { createContext, useContext } from 'react';
import { UserProfile } from '../hooks/useSupabaseAuth';

interface SecurityContextType {
  canAccess: (resource: string, action: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isViewer: boolean;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
  user: UserProfile;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children, user }) => {

  const canAccess = (resource: string, action: string): boolean => {
    if (!user) return false;

    // Super admin can access everything
    if (user.role === 'super_admin') {
      return true;
    }
    
    // Check permission level
    switch (user.permissionLevel) {
      case 'full_access':
        return true;
      case 'view_edit':
        return action !== 'admin' && action !== 'delete';
      case 'view_only':
        return action === 'read';
      default:
        return false;
    }
  };

  const canAccessRoute = (route: string): boolean => {
    if (!user) return false;

    // Super admin can access all routes
    if (user.role === 'super_admin') {
      return true;
    }

    // Route-specific access control
    switch (route) {
      case 'users':
        return user.role === 'super_admin';
      case 'settings':
        return user.permissionLevel === 'full_access';
      default:
        return true;
    }
  };

  const securityContext: SecurityContextType = {
    canAccess,
    canAccessRoute,
    isAdmin: user.role === 'super_admin' || user.role === 'admin',
    isManager: user.role === 'manager',
    isViewer: user.role === 'viewer',
  };

  return (
    <SecurityContext.Provider value={securityContext}>
      {children}
    </SecurityContext.Provider>
  );
};