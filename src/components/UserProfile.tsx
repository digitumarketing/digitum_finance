import React, { useState } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { User, LogOut, Shield, Clock, Settings, ChevronDown, X, Key, Edit, Phone, Building, FileText } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { PasswordChangeForm } from './PasswordChangeForm';
import { supabase } from '../lib/supabase';

export const UserProfile: React.FC = () => {
  const { user, profile, logout } = useSupabaseAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  if (!user || !profile) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionLevelColor = (level: string) => {
    switch (level) {
      case 'full_access': return 'bg-red-100 text-red-700';
      case 'view_edit': return 'bg-yellow-100 text-yellow-700';
      case 'view_only': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatPermissionLevel = (level: string) => {
    return level.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  return (
    <>
      <div className="relative">
        {/* Profile Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900">{profile.name}</p>
            <p className="text-xs text-gray-500">{formatRole(profile.role)}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
            showDropdown ? 'rotate-180' : ''
          }`} />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{profile.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{profile.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              {/* Role and Permission Level Badges */}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(profile.role)}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {formatRole(profile.role)}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPermissionLevelColor(profile.permission_level)}`}>
                  <Key className="w-3 h-3 mr-1" />
                  {formatPermissionLevel(profile.permission_level)}
                </span>
              </div>
            </div>

            {/* User Details */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-medium ${profile.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {profile.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Member Since:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(profile.created_at)}
                  </span>
                </div>
              </div>

              {profile.last_login && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Last Login:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(profile.last_login)}
                  </span>
                </div>
              )}

              {/* Additional User Info */}
              {profile.department && (
                <div className="flex items-center space-x-2 text-sm">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">Department:</span>
                  <span className="font-medium text-gray-900">{profile.department}</span>
                </div>
              )}

              {profile.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium text-gray-900">{profile.phone}</span>
                </div>
              )}

              {profile.notes && (
                <div className="text-sm">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-500">Notes:</span>
                  </div>
                  <p className="text-gray-700 text-xs bg-gray-50 p-2 rounded">{profile.notes}</p>
                </div>
              )}
            </div>

            {/* Permissions Summary */}
            <div className="p-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Access Level</span>
              </h4>
              <div className="space-y-2 text-xs">
                {profile.permission_level === 'full_access' && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Full system access including settings and user management</span>
                  </div>
                )}
                {profile.permission_level === 'view_edit' && (
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span>Can view and edit income, expenses, and generate reports</span>
                  </div>
                )}
                {profile.permission_level === 'view_only' && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Read-only access to dashboard and reports</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100 space-y-2">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  setShowPasswordChange(true);
                }}
                className="w-full flex items-center space-x-2 p-2 text-left hover:bg-green-50 rounded-lg transition-colors text-sm text-green-600"
              >
                <Key className="w-4 h-4" />
                <span>Change Password</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 p-2 text-left hover:bg-red-50 rounded-lg transition-colors text-sm text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Security Notice */}
            <div className="p-4 bg-gray-50 rounded-b-xl">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <p className="text-xs text-gray-600">
                  Local storage session (30 days)
                Supabase session (secure authentication)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <PasswordChangeForm
          onClose={() => setShowPasswordChange(false)}
          onSubmit={handlePasswordChange}
        />
      )}
    </>
  );
};