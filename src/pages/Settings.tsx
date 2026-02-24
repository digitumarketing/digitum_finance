import React from 'react';
import { SettingsView } from '../components/SettingsView';

interface SettingsProps {
  exchangeRates: any;
  accounts: any[];
  notificationSettings: any;
  onUpdateRates: (rates: any) => Promise<void>;
  onUpdateAccount: (id: string, balance: number) => Promise<void>;
  onAddAccount: (account: any) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onUpdateNotificationSettings: (settings: any) => Promise<void>;
  onBulkImportIncome: (data: any[]) => Promise<void>;
  onBulkImportExpenses: (data: any[]) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({
  exchangeRates,
  accounts,
  notificationSettings,
  onUpdateRates,
  onUpdateAccount,
  onAddAccount,
  onDeleteAccount,
  onUpdateNotificationSettings,
  onBulkImportIncome,
  onBulkImportExpenses,
}) => {
  const handleRequestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  return (
    <SettingsView
      exchangeRates={exchangeRates}
      onUpdateRates={onUpdateRates}
      accounts={accounts}
      onUpdateAccount={onUpdateAccount}
      onAddAccount={onAddAccount}
      onDeleteAccount={onDeleteAccount}
      notificationSettings={notificationSettings}
      onUpdateNotificationSettings={onUpdateNotificationSettings}
      onRequestNotificationPermission={handleRequestNotificationPermission}
      onBulkImportIncome={onBulkImportIncome}
      onBulkImportExpenses={onBulkImportExpenses}
    />
  );
};
