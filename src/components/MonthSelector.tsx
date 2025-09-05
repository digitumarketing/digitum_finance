import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { generateMonthOptions, getMonthName } from '../utils/helpers';

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ selectedMonth, onMonthChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [customMonth, setCustomMonth] = useState(new Date().getMonth());
  
  const monthOptions = generateMonthOptions();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleQuickSelect = (value: string) => {
    onMonthChange(value);
    setShowPicker(false);
  };

  const handleCustomSelect = () => {
    const monthString = `${customYear}-${String(customMonth + 1).padStart(2, '0')}`;
    onMonthChange(monthString);
    setShowPicker(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month;

    if (direction === 'next') {
      newMonth += 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
    } else {
      newMonth -= 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
    }

    const newMonthString = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onMonthChange(newMonthString);
  };

  return (
    <div className="relative">
      {/* Compact Inline Selector */}
      <div className="flex items-center space-x-2">
        {/* Navigation Arrows */}
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Previous month"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>

        {/* Main Selector Button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-0 flex-1 sm:min-w-[180px] sm:flex-initial"
        >
          <Calendar className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="font-medium text-gray-900 truncate">
            {getMonthName(selectedMonth)}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
            showPicker ? 'rotate-180' : ''
          }`} />
        </button>

        {/* Navigation Arrows */}
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Next month"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Dropdown Picker */}
      {showPicker && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-80 max-w-[calc(100vw-2rem)]">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Period</h3>
              <button
                onClick={() => setShowPicker(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Quick Select from Recent Months */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recent Months
              </label>
              <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                {monthOptions.slice(0, 6).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleQuickSelect(option.value)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedMonth === option.value
                        ? 'bg-green-100 text-green-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Selection */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Custom Selection
              </label>
              
              {/* Year Selection */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-2">Year</label>
                <div className="grid grid-cols-5 gap-1">
                  {years.map(year => (
                    <button
                      key={year}
                      onClick={() => setCustomYear(year)}
                      className={`p-2 rounded text-xs font-medium transition-colors ${
                        customYear === year
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Selection */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-2">Month</label>
                <div className="grid grid-cols-4 gap-1">
                  {months.map((month, index) => (
                    <button
                      key={month}
                      onClick={() => setCustomMonth(index)}
                      className={`p-2 rounded text-xs font-medium transition-colors ${
                        customMonth === index
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {month.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview and Apply */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500">Selected:</p>
                <p className="font-semibold text-gray-900">
                  {months[customMonth]} {customYear}
                </p>
              </div>

              <button
                onClick={handleCustomSelect}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Apply Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};