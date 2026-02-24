import React from 'react';
import { ReportsView } from '../components/ReportsView';

interface ReportsProps {
  income: any[];
  expenses: any[];
  allIncome: any[];
  allExpenses: any[];
  selectedMonth: Date;
}

export const Reports: React.FC<ReportsProps> = ({
  income,
  expenses,
  allIncome,
  allExpenses,
  selectedMonth,
}) => {
  return (
    <ReportsView
      income={income}
      expenses={expenses}
      allIncome={allIncome}
      allExpenses={allExpenses}
      selectedMonth={selectedMonth}
    />
  );
};
