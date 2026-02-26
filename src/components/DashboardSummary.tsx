import React from 'react';
import { DashboardSummary as DashboardSummaryType } from '../types';
import { formatCurrency, getMonthName } from '../utils/helpers';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Building2, PieChart, Calculator, Clock, CheckCircle, DollarSign, XCircle } from 'lucide-react';
import { useProfitDistribution } from '../hooks/useProfitDistribution';

interface DashboardSummaryProps {
  summary: DashboardSummaryType;
  selectedMonth: string;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ summary, selectedMonth }) => {
  const { currentMonth, totalBalance } = summary;
  const profitDistribution = useProfitDistribution(selectedMonth);

  const cards = [
    {
      title: 'Total Income (PKR)',
      value: formatCurrency(currentMonth.totalIncome),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: 'Confirmed payments',
      changeColor: 'text-green-600'
    },
    {
      title: 'Expected Income',
      value: formatCurrency(currentMonth.expectedIncome),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: 'Upcoming payments',
      changeColor: 'text-blue-600'
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(currentMonth.totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: 'Company expenses',
      changeColor: 'text-red-600'
    },
    {
      title: 'Net Balance',
      value: formatCurrency(currentMonth.netBalance),
      icon: Calculator,
      color: currentMonth.netBalance >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: currentMonth.netBalance >= 0 ? 'bg-green-50' : 'bg-red-50',
      change: 'Income - Expenses',
      changeColor: currentMonth.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Month Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{getMonthName(selectedMonth)}</h2>
            <p className="text-gray-600 mt-1">Financial Overview with {profitDistribution.companyPercentage}% Company / {100 - profitDistribution.companyPercentage}% Owners Distribution</p>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-sm text-gray-500">Total Account Balance</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className={`text-xs lg:text-sm font-medium ${card.changeColor}`}>
                {card.change}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Upcoming Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Payments</h3>
              <p className="text-sm text-gray-600">{summary.upcomingIncome.length} pending</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {summary.upcomingIncome.slice(0, 3).map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.clientName}</p>
                  <p className="text-xs text-gray-600 truncate">{item.description}</p>
                  <p className="text-xs text-blue-600 mt-1">→ {item.account}</p>
                </div>
                <p className="font-semibold text-blue-600 ml-2 text-sm">
                  {formatCurrency(item.originalConvertedAmount)}
                </p>
              </div>
            ))}
            {summary.upcomingIncome.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No upcoming payments</p>
            )}
          </div>
        </div>

        {/* Partial Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Partial Payments</h3>
              <p className="text-sm text-gray-600">{summary.partialPayments.length} outstanding</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {summary.partialPayments.slice(0, 3).map(item => (
              <div key={item.id} className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.clientName}</p>
                  <p className="font-semibold text-yellow-600 text-sm">
                    {formatCurrency(item.splitAmountPKR)}
                  </p>
                </div>
                <div className="text-xs text-gray-600">
                  Outstanding: {formatCurrency(item.originalConvertedAmount - item.convertedAmount)}
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  {item.account} • {item.currency}
                </div>
              </div>
            ))}
            {summary.partialPayments.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No partial payments</p>
            )}
          </div>
        </div>

        {/* Income Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <PieChart className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Income Summary</h3>
              <p className="text-sm text-gray-600">This month's breakdown</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Confirmed</span>
              </div>
              <span className="font-semibold text-green-600 text-sm">
                {formatCurrency(currentMonth.totalIncome)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Expected</span>
              </div>
              <span className="font-semibold text-blue-600 text-sm">
                {formatCurrency(currentMonth.expectedIncome)}
              </span>
            </div>
            
            {currentMonth.cancelledIncome > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-gray-600">Cancelled</span>
                </div>
                <span className="font-semibold text-red-600 text-sm">
                  {formatCurrency(currentMonth.cancelledIncome)}
                </span>
              </div>
            )}
            
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Potential</span>
                <span className="font-bold text-gray-900 text-sm">
                  {formatCurrency(currentMonth.totalIncome + currentMonth.expectedIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SIMPLE Income Distribution (50% Company / 50% Owner Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Income Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-purple-50 rounded-lg">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Income Distribution</h3>
              <p className="text-sm text-gray-600">{profitDistribution.companyPercentage}% Company / {100 - profitDistribution.companyPercentage}% Owners split</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Company Share</p>
                  <p className="text-sm text-gray-600">{profitDistribution.companyPercentage}% for expenses & reserve</p>
                </div>
              </div>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(currentMonth.companyShare)}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Roshaan's Share</p>
                  <p className="text-sm text-gray-600">{profitDistribution.roshaanPercentage}% owner distribution</p>
                </div>
              </div>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(currentMonth.roshaanShare)}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Shahbaz's Share</p>
                  <p className="text-sm text-gray-600">{profitDistribution.shahbazPercentage}% owner distribution</p>
                </div>
              </div>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(currentMonth.shahbazShare)}</p>
            </div>

            {/* Visual Distribution Bar */}
            <div className="mt-4">
              <div className="flex h-4 rounded-lg overflow-hidden">
                <div
                  className="bg-blue-500"
                  style={{ width: `${profitDistribution.companyPercentage}%` }}
                  title={`Company: ${formatCurrency(currentMonth.companyShare)}`}
                ></div>
                <div
                  className="bg-purple-500"
                  style={{ width: `${profitDistribution.roshaanPercentage}%` }}
                  title={`Roshaan: ${formatCurrency(currentMonth.roshaanShare)}`}
                ></div>
                <div
                  className="bg-orange-500"
                  style={{ width: `${profitDistribution.shahbazPercentage}%` }}
                  title={`Shahbaz: ${formatCurrency(currentMonth.shahbazShare)}`}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Company ({profitDistribution.companyPercentage}%)</span>
                <span>Roshaan ({profitDistribution.roshaanPercentage}%)</span>
                <span>Shahbaz ({profitDistribution.shahbazPercentage}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Balance Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-green-50 rounded-lg">
              <Calculator className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Company Balance</h3>
              <p className="text-sm text-gray-600">Reserve after expenses</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Company Share ({profitDistribution.companyPercentage}%)</span>
              <span className="font-semibold text-blue-600">{formatCurrency(currentMonth.companyShare)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Expenses</span>
              <span className="font-semibold text-red-600">-{formatCurrency(currentMonth.totalExpenses)}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4">
              <span className="font-medium text-gray-900">Remaining Company Balance</span>
              <span className={`text-xl font-bold ${
                currentMonth.remainingCompanyBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(currentMonth.remainingCompanyBalance)}
              </span>
            </div>
            
            {currentMonth.remainingCompanyBalance < 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  ⚠️ Company expenses exceed the allocated share. Consider reviewing expenses or adjusting the distribution.
                </p>
              </div>
            )}

            {currentMonth.pendingPayments > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <p className="text-sm text-orange-700">
                    Pending payments: {formatCurrency(currentMonth.pendingPayments)}
                  </p>
                </div>
              </div>
            )}

            {/* Important Note */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Distribution Logic:</p>
                  <p>• Owner shares ({100 - profitDistribution.companyPercentage}% total) are not affected by company expenses</p>
                  <p>• All expenses are paid from the Company Share ({profitDistribution.companyPercentage}%)</p>
                  <p>• Distribution split applied to all currencies after PKR conversion</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};