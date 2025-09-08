import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'viewer';
  permission_level: 'view_only' | 'view_edit' | 'full_access';
  is_active: boolean;
  phone?: string;
  department?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: 'super_admin' | 'admin' | 'manager' | 'viewer';
  permission_level: 'view_only' | 'view_edit' | 'full_access';
  phone?: string;
  department?: string;
  notes?: string;
}

export interface UpdateUserData {
  name?: string;
  role?: 'super_admin' | 'admin' | 'manager' | 'viewer';
  permission_level?: 'view_only' | 'view_edit' | 'full_access';
  is_active?: boolean;
  phone?: string;
  department?: string;
  notes?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: false,
    error: null,
  });

  const [users, setUsers] = useState<UserProfile[]>([]);

  // Load user profile
  const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        permission_level: data.permission_level,
        is_active: data.is_active,
        phone: data.phone,
        department: data.department,
        notes: data.notes,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
        last_login: data.last_login,
      };
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      return null;
    }
  }, []);

  // Load all users (for super admin)
  const loadAllUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      setUsers(data.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permission_level: user.permission_level,
        is_active: user.is_active,
        phone: user.phone,
        department: user.department,
        notes: user.notes,
        created_by: user.created_by,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
      })));
    } catch (error) {
      console.error('Error in loadAllUsers:', error);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        console.log('Initializing auth...');
        
        // Set timeout for initialization
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.log('Auth initialization timeout');
            setAuthState(prev => ({ 
              ...prev, 
              isLoading: false, 
              error: 'Connection timeout. Please refresh the page.' 
            }));
          }
        }, 15000); // 15 second timeout

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) {
            clearTimeout(timeoutId);
            setAuthState(prev => ({ ...prev, isLoading: false, error: sessionError.message }));
          }
          return;
        }

        console.log('Session found:', !!session);
        
        if (session) {
          await handleUserSession(session);
        } else {
          console.log('No session found, user not logged in');
          if (mounted) {
            clearTimeout(timeoutId);
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Failed to initialize. Please refresh the page.' 
          }));
        }
      }
    };

    const handleUserSession = async (session: any) => {
      try {
        console.log('Loading user profile for:', session.user.id);
        
        const profile = await Promise.race([
          loadUserProfile(session.user.id),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile loading timeout')), 12000)
          )
        ]) as UserProfile | null;
        
        if (!mounted) return;
        
        if (profile && profile.is_active) {
          console.log('Profile loaded successfully:', profile.name);
          
          clearTimeout(timeoutId);
          setAuthState({
            user: session.user,
            profile,
            session,
            isLoading: false,
            error: null,
          });

          // Update last login in background (don't wait)
          supabase
            .from('user_profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', session.user.id)
            .then(() => console.log('Last login updated'))
            .catch(err => console.warn('Failed to update last login:', err));

          // Load all users if super admin (in background)
          if (profile.role === 'super_admin') {
            console.log('Loading all users for super admin...');
            loadAllUsers().catch(err => console.warn('Failed to load users:', err));
          }
        } else {
          console.log('Profile not found or inactive, signing out...');
          await supabase.auth.signOut();
          if (mounted) {
            clearTimeout(timeoutId);
            setAuthState(prev => ({ 
              ...prev, 
              isLoading: false, 
              error: profile ? 'Account is deactivated' : 'User profile not found' 
            }));
          }
        }
      } catch (error) {
        console.error('Error handling user session:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Failed to load profile. Please try again.' 
          }));
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('Auth state changed: User signed in');
        await handleUserSession(session);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state...');
        clearTimeout(timeoutId);
        setAuthState({
          user: null,
          profile: null,
          session: null,
          isLoading: false,
          error: null,
        });
        setUsers([]);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
        // Don't need to reload profile on token refresh
      } else if (event === 'USER_UPDATED') {
        console.log('User updated, may need to reload profile');
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      console.log('Cleaning up auth listener...');
      subscription.unsubscribe();
    };
  }, [loadUserProfile, loadAllUsers]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error.message 
        }));
        return false;
      }

      if (data.user) {
        const profile = await loadUserProfile(data.user.id);
        
        if (!profile) {
          await supabase.auth.signOut();
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'User profile not found' 
          }));
          return false;
        }

        if (!profile.is_active) {
          await supabase.auth.signOut();
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Account is deactivated' 
          }));
          return false;
        }

        // Update last login
        await supabase
          .from('user_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);

        setAuthState({
          user: data.user,
          profile: { ...profile, last_login: new Date().toISOString() },
          session: data.session,
          isLoading: false,
          error: null,
        });

        // Load all users if super admin
        if (profile.role === 'super_admin') {
          await loadAllUsers();
        }

        return true;
      }

      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      return false;
    }
  }, [loadUserProfile, loadAllUsers]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log('Logging out user...');
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      await supabase.auth.signOut();
      
      // Clear all local state immediately
      setAuthState({
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        error: null,
      });
      setUsers([]);
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if logout fails, clear local state
      setAuthState({
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        error: null,
      });
      setUsers([]);
    }
  }, []);

  // Create user (Super Admin only)
  const createUser = useCallback(async (userData: CreateUserData): Promise<boolean> => {
    if (!authState.profile || authState.profile.role !== 'super_admin') {
      throw new Error('Only Super Admin can create users');
    }

    if (!supabaseAdmin) {
      throw new Error('Admin client not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your environment variables.');
    }

    try {
      // Create auth user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Failed to create user');
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          permission_level: userData.permission_level,
          phone: userData.phone,
          department: userData.department,
          notes: userData.notes,
          created_by: authState.user?.id,
        });

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        throw new Error(profileError.message);
      }

      // Reload users list
      await loadAllUsers();
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }, [authState.profile, authState.user, loadAllUsers]);

  // Update user
  const updateUser = useCallback(async (userId: string, updates: UpdateUserData): Promise<boolean> => {
    if (!authState.profile || authState.profile.role !== 'super_admin') {
      throw new Error('Only Super Admin can update users');
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      // Reload users list
      await loadAllUsers();

      // Update current user if it's the same user
      if (authState.user?.id === userId) {
        const updatedProfile = await loadUserProfile(userId);
        if (updatedProfile) {
          setAuthState(prev => ({ ...prev, profile: updatedProfile }));
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, [authState.profile, authState.user, loadAllUsers, loadUserProfile]);

  // Delete user
  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!authState.profile || authState.profile.role !== 'super_admin') {
      throw new Error('Only Super Admin can delete users');
    }

    if (userId === authState.user?.id) {
      throw new Error('Cannot delete your own account');
    }

    if (!supabaseAdmin) {
      throw new Error('Admin client not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your environment variables.');
    }

    try {
      // Delete auth user (cascades to profile)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        throw new Error(error.message);
      }

      // Reload users list
      await loadAllUsers();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }, [authState.profile, authState.user, loadAllUsers]);

  // Change password
  const changePassword = useCallback(async (userId: string, passwordData: ChangePasswordData): Promise<boolean> => {
    if (!authState.user) {
      throw new Error('User not authenticated');
    }

    // Only allow users to change their own password or super admin to change any password
    if (authState.user.id !== userId && authState.profile?.role !== 'super_admin') {
      throw new Error('Not authorized to change this password');
    }

    if (authState.profile?.role === 'super_admin' && !supabaseAdmin) {
      throw new Error('Admin client not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your environment variables.');
    }

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters');
      }

      // For super admin changing other's password, use admin update
      if (authState.profile?.role === 'super_admin' && userId !== authState.user.id) {
        const { error } = await supabaseAdmin!.auth.admin.updateUserById(userId, {
          password: passwordData.newPassword,
        });

        if (error) {
          throw new Error(error.message);
        }
      } else {
        // User changing their own password
        const { error } = await supabase.auth.updateUser({
          password: passwordData.newPassword,
        });

        if (error) {
          throw new Error(error.message);
        }
      }

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }, [authState.user, authState.profile]);

  // Reset password (Super Admin only)
  const resetPassword = useCallback(async (userId: string, newPassword: string): Promise<boolean> => {
    if (!authState.profile || authState.profile.role !== 'super_admin') {
      throw new Error('Only Super Admin can reset passwords');
    }

    if (!supabaseAdmin) {
      throw new Error('Admin client not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your environment variables.');
    }

    try {
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }, [authState.profile]);

  // Clear error
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    user: authState.user,
    profile: authState.profile,
    session: authState.session,
    isLoading: authState.isLoading,
    error: authState.error,
    isAuthenticated: !!authState.user && !!authState.profile,
    users,
    login,
    logout,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    resetPassword,
    clearError,
    loadAllUsers,
  };
};