// Authentication and authorization types

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'viewer';

export type PermissionLevel = 'view_only' | 'view_edit' | 'full_access';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissionLevel: PermissionLevel;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  permissions: Permission[];
  createdBy?: string; // ID of user who created this account
  phone?: string;
  department?: string;
  notes?: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  permissionLevel: PermissionLevel;
  phone?: string;
  department?: string;
  notes?: string;
}

export interface UpdateUserData {
  name?: string;
  role?: UserRole;
  permissionLevel?: PermissionLevel;
  isActive?: boolean;
  phone?: string;
  department?: string;
  notes?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Permission level mappings
export const PERMISSION_LEVEL_PERMISSIONS: Record<PermissionLevel, Permission[]> = {
  view_only: [
    { id: '1', name: 'View Dashboard', resource: 'dashboard', action: 'read' },
    { id: '2', name: 'View Accounts', resource: 'accounts', action: 'read' },
    { id: '3', name: 'View Reports', resource: 'reports', action: 'read' },
  ],
  view_edit: [
    { id: '1', name: 'View Dashboard', resource: 'dashboard', action: 'read' },
    { id: '2', name: 'Manage Income', resource: 'income', action: 'write' },
    { id: '3', name: 'Manage Expenses', resource: 'expenses', action: 'write' },
    { id: '4', name: 'View Accounts', resource: 'accounts', action: 'read' },
    { id: '5', name: 'View Reports', resource: 'reports', action: 'read' },
    { id: '6', name: 'Export Data', resource: 'reports', action: 'export' },
  ],
  full_access: [
    { id: '1', name: 'View Dashboard', resource: 'dashboard', action: 'read' },
    { id: '2', name: 'Manage Income', resource: 'income', action: 'write' },
    { id: '3', name: 'Manage Expenses', resource: 'expenses', action: 'write' },
    { id: '4', name: 'Manage Accounts', resource: 'accounts', action: 'write' },
    { id: '5', name: 'View Reports', resource: 'reports', action: 'read' },
    { id: '6', name: 'Export Data', resource: 'reports', action: 'export' },
    { id: '7', name: 'Manage Settings', resource: 'settings', action: 'write' },
    { id: '8', name: 'Delete Records', resource: 'all', action: 'delete' },
  ],
};

// Role-based permissions (Super Admin gets everything)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    ...PERMISSION_LEVEL_PERMISSIONS.full_access,
    { id: '9', name: 'Manage Users', resource: 'users', action: 'write' },
    { id: '10', name: 'System Administration', resource: 'system', action: 'admin' },
    { id: '11', name: 'View All Data', resource: 'all', action: 'read' },
    { id: '12', name: 'Manage All Data', resource: 'all', action: 'write' },
  ],
  admin: PERMISSION_LEVEL_PERMISSIONS.full_access,
  manager: PERMISSION_LEVEL_PERMISSIONS.view_edit,
  viewer: PERMISSION_LEVEL_PERMISSIONS.view_only,
};

// Default Super Admin user
export const SUPER_ADMIN_USER: User = {
  id: 'super_admin_1',
  email: 'superadmin@digitum.com',
  name: 'Super Administrator',
  role: 'super_admin',
  permissionLevel: 'full_access',
  createdAt: new Date().toISOString(),
  isActive: true,
  permissions: ROLE_PERMISSIONS.super_admin,
  department: 'System Administration',
  notes: 'Default Super Admin account with full system control',
};

// Default users for demo
export const DEFAULT_USERS: User[] = [
  SUPER_ADMIN_USER,
  {
    id: '2',
    email: 'admin@digitum.com',
    name: 'Admin User',
    role: 'admin',
    permissionLevel: 'full_access',
    createdAt: new Date().toISOString(),
    isActive: true,
    permissions: ROLE_PERMISSIONS.admin,
    createdBy: 'super_admin_1',
    department: 'Finance',
  },
  {
    id: '3',
    email: 'manager@digitum.com',
    name: 'Manager User',
    role: 'manager',
    permissionLevel: 'view_edit',
    createdAt: new Date().toISOString(),
    isActive: true,
    permissions: ROLE_PERMISSIONS.manager,
    createdBy: 'super_admin_1',
    department: 'Operations',
  },
  {
    id: '4',
    email: 'viewer@digitum.com',
    name: 'Viewer User',
    role: 'viewer',
    permissionLevel: 'view_only',
    createdAt: new Date().toISOString(),
    isActive: true,
    permissions: ROLE_PERMISSIONS.viewer,
    createdBy: 'super_admin_1',
    department: 'Reporting',
  },
];