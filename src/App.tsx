import React, { useState } from 'react';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useSupabaseData } from './hooks/useSupabaseData';
import { LoginForm } from './components/LoginForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SecurityProvider } from './components/SecurityProvider';
import { UserProfile } from './components/UserProfile';
import { Navigation } from './components/Navigation';
import { MonthSelector } from './components/MonthSelector';
import { DashboardSummary } from './components/DashboardSummary';
import { IncomeForm } from './components/IncomeForm';
import { ExpenseForm } from './components/ExpenseForm';
import { DataTable } from './components/DataTable';
import { AccountsView } from './components/AccountsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { NotificationPanel } from './components/NotificationPanel';
import { Plus, Shield, AlertTriangle, Database } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const {
    income,
    expenses,
    accounts,
    exchangeRates,
    selectedMonth,
    dashboardSummary,
    allIncome,
    allExpenses,
    notifications,
    notificationSettings,
    unreadNotifications,
    isLoading,
    addIncome,
    addExpense,
    updateIncome,
    updateExpense,
    deleteIncome,
    deleteExpense,
    updateAccountBalance,
    addAccount,
    deleteAccount,
    setExchangeRates,
    setSelectedMonth,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    updateNotificationSettings,
    refreshData,
  } = useSupabaseData();

  const handleAddIncome = async (data: any) => {
    console.log('Adding income:', data);
    if (editingIncome) {
      console.log('Updating income:', editingIncome.id);
      await updateIncome(editingIncome.id, data);
      setEditingIncome(null);
    } else {
      console.log('Creating new income entry');
      await addIncome(data);
    }
    setShowIncomeForm(false);
  };

  const handleEditIncome = (income: any) => {
    console.log('Editing income:', income);
    setEditingIncome(income);
    setShowIncomeForm(true);
  };

  const handleAddExpense = async (data: any) => {
    console.log('Adding expense:', data);
    if (editingExpense) {
      console.log('Updating expense:', editingExpense.id);
      await updateExpense(editingExpense.id, data);
      setEditingExpense(null);
    } else {
      console.log('Creating new expense entry');
      await addExpense(data);
    }
    setShowExpenseForm(false);
  };

  const handleEditExpense = (expense: any) => {
    console.log('Editing expense:', expense);
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const canAccessTab = (tab: string) => {
    // For now, super admin can access everything
    return true;
  };

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading financial data...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardSummary summary={dashboardSummary} selectedMonth={selectedMonth} />
            
            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
              <DataTable 
                data={dashboardSummary.recentTransactions} 
                type={dashboardSummary.recentTransactions[0] && 'clientName' in dashboardSummary.recentTransactions[0] ? 'income' : 'expense'}
                onDelete={(id) => {
                  const isIncome = dashboardSummary.recentTransactions.find(t => t.id === id && 'clientName' in t);
                  if (isIncome) {
                    deleteIncome(id);
                  } else {
                    deleteExpense(id);
                  }
                }}
                onEdit={(item) => {
                  if ('clientName' in item) {
                    handleEditIncome(item);
                  } else {
                    handleEditExpense(item);
                  }
                }}
                exchangeRates={exchangeRates}
              />
            </div>
          </div>
        );

      case 'income':
        return (
          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Income Management</h2>
                <p className="text-gray-600 mt-1">Track and manage your income sources with payment status</p>
              </div>
              <button
                onClick={() => {
                  setEditingIncome(null);
                  setShowIncomeForm(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Add Income</span>
              </button>
            </div>

            {/* Income Form */}
            {showIncomeForm && (
              <IncomeForm
                onSubmit={handleAddIncome}
                onCancel={() => {
                  setShowIncomeForm(false);
                  setEditingIncome(null);
                }}
                exchangeRates={exchangeRates}
                accounts={accounts.map(acc => ({ name: acc.name, currency: acc.currency }))}
                editData={editingIncome}
              />
            )}

            {/* Income Table */}
            <DataTable 
              data={income} 
              type="income"
              onDelete={deleteIncome}
              onEdit={handleEditIncome}
              exchangeRates={exchangeRates}
            />
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Expense Management</h2>
                <p className="text-gray-600 mt-1">Track and manage your business expenses</p>
              </div>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setShowExpenseForm(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            </div>

            {/* Expense Form */}
            {showExpenseForm && (
              <ExpenseForm
                onSubmit={handleAddExpense}
                onCancel={() => {
                  setShowExpenseForm(false);
                  setEditingExpense(null);
                }}
                exchangeRates={exchangeRates}
                accounts={accounts.map(acc => ({ name: acc.name, currency: acc.currency }))}
                editData={editingExpense}
              />
            )}

            {/* Expenses Table */}
            <DataTable 
              data={expenses} 
              type="expense"
              onDelete={deleteExpense}
              onEdit={handleEditExpense}
              exchangeRates={exchangeRates}
            />
          </div>
        );

      case 'accounts':
        return (
          <AccountsView 
            accounts={accounts}
            onUpdateBalance={updateAccountBalance}
          />
        );

      case 'reports':
        return (
          <ReportsView 
            income={income}
            expenses={expenses}
            allIncome={allIncome}
            allExpenses={allExpenses}
            selectedMonth={selectedMonth}
          />
        );

      case 'settings':
        return (
          <SettingsView 
            exchangeRates={exchangeRates}
            onUpdateRates={setExchangeRates}
            accounts={accounts}
            onUpdateAccount={updateAccountBalance}
            onAddAccount={addAccount}
            onDeleteAccount={deleteAccount}
            notificationSettings={notificationSettings}
            onUpdateNotificationSettings={updateNotificationSettings}
            onRequestNotificationPermission={async () => {
              if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                return permission === 'granted';
              }
              return false;
            }}
          />
        );

      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Page Not Found</h3>
            <p className="text-gray-500">The requested page could not be found.</p>
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'income': return 'Income Management';
      case 'expenses': return 'Expense Management';
      case 'accounts': return 'Account Balances';
      case 'reports': return 'Reports & Analytics';
      case 'settings': return 'Settings';
      default: return 'Digitum Finance';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navigation */}
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        canAccessTab={canAccessTab}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-100 p-4 lg:p-6 pt-16 lg:pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-semib old text-gray-900">
                  {getPageTitle()}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Supabase Database</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Notification Panel */}
              <NotificationPanel
                notifications={notifications}
                unreadCount={unreadNotifications}
                onMarkAsRead={markNotificationAsRead}
                onMarkAllAsRead={markAllNotificationsAsRead}
                onDelete={deleteNotification}
                onClearAll={clearAllNotifications}
              />
              
              {/* Month Selector */}
              {activeTab !== 'settings' && (
                <div className="w-full sm:w-80">
                  <MonthSelector 
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                  />
                </div>
              )}

              {/* User Profile */}
              <UserProfile />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}

function App() {
  const { user, profile, isAuthenticated, isLoading, error, login, logout, clearError } = useSupabaseAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Digitum Finance...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to Supabase...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's a critical error
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="p-3 bg-red-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated || !user || !profile) {
    return (
      <LoginForm 
        onLogin={async ({ email, password }) => await login(email, password)}
        isLoading={isLoading}
        error={error}
        onClearError={clearError}
      />
    );
  }

  // Show main app with security context
  return (
    <SecurityProvider user={profile}>
      <AppContent />
    </SecurityProvider>
  );
}

export default App;