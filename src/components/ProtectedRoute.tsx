import React from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { Shield, AlertTriangle, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: {
    resource: string;
    action: string;
  };
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallback
}) => {
  const { user, profile, isAuthenticated, isLoading } = useSupabaseAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated || !user || !profile) {
    return null; // This will be handled by the main App component
  }

  // Check role-based access
  if (requiredRole && profile.role !== requiredRole) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="p-3 bg-red-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You need <span className="font-medium text-red-600">{requiredRole}</span> role to access this page.
          </p>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">
              Your permission level: <span className="font-medium">{profile.permission_level}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // For super admin, allow all access
  if (profile.role === 'super_admin') {
    return <>{children}</>;
  }

  // Check permission level access
  if (requiredPermission) {
    const hasAccess = 
      profile.permission_level === 'full_access' ||
      (profile.permission_level === 'view_edit' && requiredPermission.action !== 'admin') ||
      (profile.permission_level === 'view_only' && requiredPermission.action === 'read');

    if (!hasAccess) {
      return fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
            <div className="p-3 bg-orange-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Insufficient Permissions</h2>
            <p className="text-gray-600 mb-4">
              You don't have the required permissions to access this feature.
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">
                Your permission level: <span className="font-medium">{user.permissionLevel}</span>
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // User has access, render children
  return <>{children}</>;
};