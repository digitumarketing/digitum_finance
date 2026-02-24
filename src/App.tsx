import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useSupabaseData } from './hooks/useSupabaseData';
import { LoginForm } from './components/LoginForm';
import { SecurityProvider } from './components/SecurityProvider';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Income } from './pages/Income';
import { Expenses } from './pages/Expenses';
import { Accounts } from './pages/Accounts';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { AlertTriangle } from 'lucide-react';

function AppRoutes() {
  const navigate = useNavigate();
  const { profile } = useSupabaseAuth();
  const isSuperAdmin = profile?.role === 'super_admin';

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
    recalculateAllBalances,
    bulkImportIncome,
    bulkImportExpenses,
    deleteAllIncome,
    deleteAllExpenses,
  } = useSupabaseData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainLayout
            selectedMonth={selectedMonth}
            notifications={notifications}
            unreadNotifications={unreadNotifications}
            onMonthChange={setSelectedMonth}
            onMarkNotificationAsRead={markNotificationAsRead}
            onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
            onDeleteNotification={deleteNotification}
            onClearAllNotifications={clearAllNotifications}
          />
        }
      >
        <Route
          index
          element={
            <Dashboard
              summary={dashboardSummary}
              selectedMonth={selectedMonth}
              allIncome={allIncome}
              allExpenses={allExpenses}
              exchangeRates={exchangeRates}
              accounts={accounts}
              isSuperAdmin={isSuperAdmin}
              onDeleteIncome={deleteIncome}
              onDeleteExpense={deleteExpense}
              onUpdateIncome={updateIncome}
              onUpdateExpense={updateExpense}
              onAddIncome={() => navigate('/income')}
              onAddExpense={() => navigate('/expenses')}
            />
          }
        />
        <Route
          path="income"
          element={
            <Income
              income={income}
              allIncome={allIncome}
              exchangeRates={exchangeRates}
              accounts={accounts}
              isSuperAdmin={isSuperAdmin}
              onAddIncome={addIncome}
              onUpdateIncome={updateIncome}
              onDeleteIncome={deleteIncome}
              onDeleteAllIncome={deleteAllIncome}
            />
          }
        />
        <Route
          path="expenses"
          element={
            <Expenses
              expenses={expenses}
              allExpenses={allExpenses}
              exchangeRates={exchangeRates}
              accounts={accounts}
              isSuperAdmin={isSuperAdmin}
              onAddExpense={addExpense}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
              onDeleteAllExpenses={deleteAllExpenses}
            />
          }
        />
        <Route
          path="accounts"
          element={
            <Accounts
              accounts={accounts}
              totalCompanyBalance={dashboardSummary.currentMonth.remainingCompanyBalance}
              onRefreshBalances={recalculateAllBalances}
            />
          }
        />
        <Route
          path="reports"
          element={
            <Reports
              income={income}
              expenses={expenses}
              allIncome={allIncome}
              allExpenses={allExpenses}
              selectedMonth={selectedMonth}
            />
          }
        />
        <Route
          path="settings"
          element={
            <Settings
              exchangeRates={exchangeRates}
              accounts={accounts}
              notificationSettings={notificationSettings}
              onUpdateRates={setExchangeRates}
              onUpdateAccount={updateAccountBalance}
              onAddAccount={addAccount}
              onDeleteAccount={deleteAccount}
              onUpdateNotificationSettings={updateNotificationSettings}
              onBulkImportIncome={bulkImportIncome}
              onBulkImportExpenses={bulkImportExpenses}
            />
          }
        />
      </Route>
    </Routes>
  );
}

function AppContent() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function App() {
  const { user, profile, isAuthenticated, isLoading, error, login, clearError } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading Digitum Finance...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to Supabase...</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
          >
            Taking too long? Refresh page
          </button>
        </div>
      </div>
    );
  }

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
            onClick={() => {
              clearError();
              window.location.reload();
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <SecurityProvider user={profile}>
      <AppContent />
    </SecurityProvider>
  );
}

export default App;
