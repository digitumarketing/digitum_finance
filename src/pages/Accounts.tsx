import React from 'react';
import { AccountsView } from '../components/AccountsView';

interface AccountsProps {
  accounts: any[];
  totalCompanyBalance: number;
  onRefreshBalances: () => Promise<void>;
}

export const Accounts: React.FC<AccountsProps> = ({
  accounts,
  totalCompanyBalance,
  onRefreshBalances,
}) => {
  return (
    <AccountsView
      accounts={accounts}
      onRefreshBalances={onRefreshBalances}
      totalCompanyBalance={totalCompanyBalance}
    />
  );
};
