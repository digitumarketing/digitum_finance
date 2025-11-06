import React, { useState } from 'react';
import { DynamicExchangeRatesSettings } from './DynamicExchangeRatesSettings';
import { DynamicAccountManagement } from './DynamicAccountManagement';
import { NotificationSettings } from './NotificationSettings';
import { UserManagement } from './UserManagement';
import { DataManagement } from './DataManagement';
import { DataImport } from './DataImport';
import { ExchangeRates, Account, NotificationSettings as NotificationSettingsType } from '../types';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { Settings, DollarSign, Building2, Bell, Database, Users, Crown, PieChart } from 'lucide-react';
import { ProfitDistributionSettings } from './ProfitDistributionSettings';

interface SettingsViewProps {
  exchangeRates: ExchangeRates;
  onUpdateRates: (rates: ExchangeRates) => void;
  accounts: Account[];
  onUpdateAccount: (id: string, updates: Partial<Account>) => void;
  onAddAccount?: (account: Omit<Account, 'id'>) => void;
  onDeleteAccount?: (id: string) => void;
  notificationSettings: NotificationSettingsType;
  onUpdateNotificationSettings: (settings: NotificationSettingsType) => void;
  onRequestNotificationPermission: () => Promise<boolean>;
  onBulkImportIncome?: (data: any[]) => Promise<void>;
  onBulkImportExpenses?: (data: any[]) => Promise<void>;
}

type SettingsSection = 'exchange-rates' | 'accounts' | 'notifications' | 'profit-distribution' | 'users' | 'data';

export const SettingsView: React.FC<SettingsViewProps> = ({
  exchangeRates,
  onUpdateRates,
  accounts,
  onUpdateAccount,
  onAddAccount,
  onDeleteAccount,
  notificationSettings,
  onUpdateNotificationSettings,
  onRequestNotificationPermission,
  onBulkImportIncome,
  onBulkImportExpenses
}) => {
  const { profile: user } = useSupabaseAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('exchange-rates');

  const settingsSections = [
    {
      id: 'exchange-rates' as SettingsSection,
      name: 'Exchange Rates',
      icon: DollarSign,
      description: 'Manage currency conversion rates',
      requiredRole: null // Available to all users with settings access
    },
    {
      id: 'accounts' as SettingsSection,
      name: 'Account Management',
      icon: Building2,
      description: 'Manage payment accounts and labels',
      requiredRole: null
    },
    {
      id: 'notifications' as SettingsSection,
      name: 'Notifications',
      icon: Bell,
      description: 'Configure alerts and reminders',
      requiredRole: null
    },
    {
      id: 'profit-distribution' as SettingsSection,
      name: 'Profit Distribution',
      icon: PieChart,
      description: 'Configure company and owner profit split ratios',
      requiredRole: null
    },
    {
      id: 'users' as SettingsSection,
      name: 'User Management',
      icon: Users,
      description: 'Manage users, roles, and permissions',
      requiredRole: 'super_admin' // Only Super Admin
    },
    {
      id: 'data' as SettingsSection,
      name: 'Data Management',
      icon: Database,
      description: 'Import, export, and backup options',
      requiredRole: null
    }
  ];

  // Filter sections based on user role
  const availableSections = settingsSections.filter(section => 
    !section.requiredRole || user?.role === section.requiredRole
  );

  // Ensure active section is available to current user
  React.useEffect(() => {
    if (!availableSections.find(section => section.id === activeSection)) {
      setActiveSection(availableSections[0]?.id || 'exchange-rates');
    }
  }, [user, activeSection, availableSections]);

  const renderSettingsContent = () => {
    switch (activeSection) {
      case 'exchange-rates':
        return (
          <DynamicExchangeRatesSettings 
            exchangeRates={exchangeRates}
            onUpdateRates={onUpdateRates}
          />
        );
      
      case 'accounts':
        return (
          <DynamicAccountManagement 
            accounts={accounts}
            exchangeRates={exchangeRates}
            onUpdateAccount={onUpdateAccount}
            onAddAccount={onAddAccount}
            onDeleteAccount={onDeleteAccount}
          />
        );
      
      case 'notifications':
        return (
          <NotificationSettings 
            settings={notificationSettings}
            onUpdateSettings={onUpdateNotificationSettings}
            onRequestPermission={onRequestNotificationPermission}
          />
        );

      case 'users':
        return <UserManagement />;

      case 'profit-distribution':
        return <ProfitDistributionSettings />;
      
      case 'data':
        if (onBulkImportIncome && onBulkImportExpenses) {
          return (
            <DataImport
              onImportIncome={onBulkImportIncome}
              onImportExpenses={onBulkImportExpenses}
              accounts={accounts.map(acc => ({ name: acc.name, currency: acc.currency }))}
              exchangeRates={exchangeRates}
            />
          );
        }
        return <DataManagement />;
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <p className="text-gray-600 mt-1">Manage your application preferences and configurations</p>
            </div>
          </div>
          {user?.role === 'super_admin' && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              <Crown className="w-4 h-4" />
              <span>Super Admin</span>
            </div>
          )}
        </div>
      </div>

      {/* Data Persistence Information */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Database className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 mb-2">Supabase Cloud Database Storage</h4>
            <div className="text-sm text-green-800 space-y-2">
              <p>• <strong>Cloud Storage:</strong> All your data is securely stored in Supabase cloud database</p>
              <p>• <strong>Session Length:</strong> Login sessions last for 30 days and auto-extend with activity</p>
              <p>• <strong>Data Safety:</strong> Your data is encrypted and backed up automatically by Supabase</p>
              <p>• <strong>Access Anywhere:</strong> Login from any device or browser to access your data</p>
              <p>• <strong>No Data Loss:</strong> Clearing browser cache will NOT delete your data</p>
              <p>• <strong>Backup Recommendation:</strong> Use the Data Management section to export your data for local backups</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex space-x-0 overflow-x-auto">
            {availableSections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-shrink-0 flex items-center justify-center space-x-2 px-4 py-4 text-sm font-medium transition-colors border-b-2 min-w-max ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                } ${index !== 0 ? 'border-l border-gray-100' : ''}`}
              >
                <section.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{section.name}</span>
                {section.requiredRole === 'super_admin' && (
                  <Crown className="w-3 h-3 text-purple-600" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {availableSections.find(s => s.id === activeSection)?.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {availableSections.find(s => s.id === activeSection)?.description}
            </p>
          </div>
          
          {renderSettingsContent()}
        </div>
      </div>
    </div>
  );
};