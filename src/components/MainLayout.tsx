import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { MonthSelector } from './MonthSelector';
import { UserProfile } from './UserProfile';
import { NotificationPanel } from './NotificationPanel';

interface MainLayoutProps {
  selectedMonth: Date;
  notifications: any[];
  unreadNotifications: number;
  onMonthChange: (date: Date) => void;
  onMarkNotificationAsRead: (id: string) => Promise<void>;
  onMarkAllNotificationsAsRead: () => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
  onClearAllNotifications: () => Promise<void>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  selectedMonth,
  notifications,
  unreadNotifications,
  onMonthChange,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onDeleteNotification,
  onClearAllNotifications,
}) => {
  const location = useLocation();

  const canAccessTab = () => {
    return true;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/income':
        return 'Income Management';
      case '/expenses':
        return 'Expense Management';
      case '/accounts':
        return 'Account Balances';
      case '/reports':
        return 'Reports & Analytics';
      case '/settings':
        return 'Settings';
      default:
        return 'Digitum Finance';
    }
  };

  const isSettingsPage = location.pathname === '/settings';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navigation */}
      <Navigation canAccessTab={canAccessTab} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0 overflow-x-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-100 p-4 lg:p-6 pt-16 lg:pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 max-w-full">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-shrink-0">
              {/* Notification Panel */}
              <NotificationPanel
                notifications={notifications}
                unreadCount={unreadNotifications}
                onMarkAsRead={onMarkNotificationAsRead}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                onDelete={onDeleteNotification}
                onClearAll={onClearAllNotifications}
              />

              {/* Month Selector */}
              {!isSettingsPage && (
                <div className="flex-shrink-0">
                  <MonthSelector
                    selectedMonth={selectedMonth}
                    onMonthChange={onMonthChange}
                  />
                </div>
              )}

              {/* User Profile */}
              <UserProfile />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
