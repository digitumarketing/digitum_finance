import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, X, Eye, Database } from 'lucide-react';
import { Income, Expense, ExchangeRates } from '../types';

interface DataImportProps {
  onImportIncome: (data: any[]) => Promise<void>;
  onImportExpenses: (data: any[]) => Promise<void>;
  accounts: Array<{ name: string; currency: string }>;
  exchangeRates: ExchangeRates;
}

interface ParsedData {
  income: any[];
  expenses: any[];
  errors: string[];
}

export const DataImport: React.FC<DataImportProps> = ({
  onImportIncome,
  onImportExpenses,
  accounts,
  exchangeRates
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importing, setImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importStats, setImportStats] = useState({ income: 0, expenses: 0 });

  const downloadTemplate = () => {
    const incomeTemplate = [
      {
        'Type': 'Income',
        'Date': '2024-01-15',
        'Original Amount': 1000,
        'Currency': 'USD',
        'Received Amount': 1000,
        'Category': 'Design Services',
        'Description': 'Website design project',
        'Client Name': 'ABC Company',
        'Account': 'Wise Business',
        'Status': 'Received',
        'Due Date': '',
        'Notes': 'Optional notes',
      }
    ];

    const expenseTemplate = [
      {
        'Type': 'Expense',
        'Date': '2024-01-16',
        'Amount': 500,
        'Currency': 'PKR',
        'Category': 'Office Supplies',
        'Description': 'Office equipment',
        'Account': 'Meezan Bank',
        'Payment Status': 'Done',
        'Due Date': '',
        'Notes': 'Optional notes',
      }
    ];

    const combinedTemplate = [...incomeTemplate, ...expenseTemplate];

    const ws = XLSX.utils.json_to_sheet(combinedTemplate);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    // Set column widths
    ws['!cols'] = [
      { wch: 10 }, // Type
      { wch: 12 }, // Date
      { wch: 15 }, // Amount
      { wch: 10 }, // Currency
      { wch: 15 }, // Received Amount / blank for expenses
      { wch: 20 }, // Category
      { wch: 30 }, // Description
      { wch: 20 }, // Client/Account
      { wch: 15 }, // Account
      { wch: 15 }, // Status
      { wch: 12 }, // Due Date
      { wch: 30 }, // Notes
    ];

    XLSX.writeFile(wb, 'digitum_finance_import_template.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      parseExcelFile(uploadedFile);
    }
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const result = validateAndParseData(jsonData);
        setParsedData(result);
        setShowPreview(true);
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing Excel file. Please check the format and try again.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const validateAndParseData = (data: any[]): ParsedData => {
    const income: any[] = [];
    const expenses: any[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 2; // Excel row number (1 is header)
      const type = String(row['Type'] || '').trim().toLowerCase();

      if (!type) {
        errors.push(`Row ${rowNum}: Type is required (Income or Expense)`);
        return;
      }

      if (type === 'income') {
        const incomeData = parseIncomeRow(row, rowNum, errors);
        if (incomeData) income.push(incomeData);
      } else if (type === 'expense') {
        const expenseData = parseExpenseRow(row, rowNum, errors);
        if (expenseData) expenses.push(expenseData);
      } else {
        errors.push(`Row ${rowNum}: Invalid Type "${row['Type']}". Must be "Income" or "Expense"`);
      }
    });

    return { income, expenses, errors };
  };

  const parseIncomeRow = (row: any, rowNum: number, errors: string[]): any | null => {
    const date = parseDate(row['Date']);
    if (!date) {
      errors.push(`Row ${rowNum}: Invalid or missing Date`);
      return null;
    }

    const originalAmount = parseFloat(row['Original Amount'] || row['Amount']) || 0;
    if (originalAmount <= 0) {
      errors.push(`Row ${rowNum}: Invalid Original Amount`);
      return null;
    }

    const currency = String(row['Currency'] || 'PKR').trim().toUpperCase();
    const receivedAmount = parseFloat(row['Received Amount']) || originalAmount;
    const category = String(row['Category'] || 'Other').trim();
    const description = String(row['Description'] || '').trim();
    const clientName = String(row['Client Name'] || 'Unknown').trim();
    const account = String(row['Account'] || '').trim();
    const status = String(row['Status'] || 'Received').trim();
    const dueDate = parseDate(row['Due Date']) || null;
    const notes = String(row['Notes'] || '').trim();

    if (!account) {
      errors.push(`Row ${rowNum}: Account is required`);
      return null;
    }

    // Validate account exists
    const accountExists = accounts.some(acc => acc.name === account);
    if (!accountExists) {
      errors.push(`Row ${rowNum}: Account "${account}" not found. Please create it first.`);
      return null;
    }

    // Validate status
    if (!['Received', 'Upcoming', 'Partial', 'Cancelled'].includes(status)) {
      errors.push(`Row ${rowNum}: Invalid Status "${status}". Must be: Received, Upcoming, Partial, or Cancelled`);
      return null;
    }

    return {
      date,
      originalAmount,
      currency,
      receivedAmount,
      category,
      description,
      clientName,
      account,
      status,
      dueDate,
      notes
    };
  };

  const parseExpenseRow = (row: any, rowNum: number, errors: string[]): any | null => {
    const date = parseDate(row['Date']);
    if (!date) {
      errors.push(`Row ${rowNum}: Invalid or missing Date`);
      return null;
    }

    const amount = parseFloat(row['Amount']) || 0;
    if (amount <= 0) {
      errors.push(`Row ${rowNum}: Invalid Amount`);
      return null;
    }

    const currency = String(row['Currency'] || 'PKR').trim().toUpperCase();
    const category = String(row['Category'] || 'Other').trim();
    const description = String(row['Description'] || '').trim();
    const account = String(row['Account'] || '').trim();
    const paymentStatus = String(row['Payment Status'] || 'Done').trim();
    const dueDate = parseDate(row['Due Date']) || null;
    const notes = String(row['Notes'] || '').trim();

    if (!account) {
      errors.push(`Row ${rowNum}: Account is required`);
      return null;
    }

    // Validate account exists
    const accountExists = accounts.some(acc => acc.name === account);
    if (!accountExists) {
      errors.push(`Row ${rowNum}: Account "${account}" not found. Please create it first.`);
      return null;
    }

    // Validate payment status
    if (!['Done', 'Pending'].includes(paymentStatus)) {
      errors.push(`Row ${rowNum}: Invalid Payment Status "${paymentStatus}". Must be: Done or Pending`);
      return null;
    }

    return {
      date,
      amount,
      currency,
      category,
      description,
      account,
      paymentStatus,
      dueDate,
      notes
    };
  };

  const parseDate = (dateValue: any): string | null => {
    if (!dateValue) return null;

    try {
      // Handle Excel date serial numbers
      if (typeof dateValue === 'number') {
        const date = XLSX.SSF.parse_date_code(dateValue);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }

      // Handle string dates
      const dateStr = String(dateValue).trim();
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return null;
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    try {
      let incomeCount = 0;
      let expenseCount = 0;

      if (parsedData.income.length > 0) {
        await onImportIncome(parsedData.income);
        incomeCount = parsedData.income.length;
      }

      if (parsedData.expenses.length > 0) {
        await onImportExpenses(parsedData.expenses);
        expenseCount = parsedData.expenses.length;
      }

      setImportStats({ income: incomeCount, expenses: expenseCount });
      setImportComplete(true);
      setShowPreview(false);
      setParsedData(null);
      setFile(null);
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data: ' + (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setParsedData(null);
    setShowPreview(false);
    setImportComplete(false);
    setImportStats({ income: 0, expenses: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import Data from Excel</h2>
            <p className="text-gray-600 mt-1">Upload your past income and expense records in bulk</p>
          </div>
        </div>
      </div>

      {/* Import Complete Message */}
      {importComplete && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 text-lg">Import Completed Successfully!</h3>
              <div className="mt-2 text-green-800">
                <p>Imported {importStats.income} income records and {importStats.expenses} expense records.</p>
                <p className="mt-1">All data has been saved to the database.</p>
              </div>
              <button
                onClick={resetImport}
                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Import More Data
              </button>
            </div>
          </div>
        </div>
      )}

      {!importComplete && (
        <>
          {/* Step 1: Download Template */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Step 1: Download Template</h3>
                  <p className="text-sm text-gray-600">Get the Excel template with the correct format</p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-purple-900 mb-2">Template Instructions:</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• <strong>Type:</strong> Must be "Income" or "Expense"</li>
                <li>• <strong>Date:</strong> Format: YYYY-MM-DD (e.g., 2024-01-15)</li>
                <li>• <strong>Currency:</strong> Use account's currency (USD, AED, GBP, PKR, etc.)</li>
                <li>• <strong>Account:</strong> Must match an existing account name exactly</li>
                <li>• <strong>Status (Income):</strong> Received, Upcoming, Partial, or Cancelled</li>
                <li>• <strong>Payment Status (Expense):</strong> Done or Pending</li>
                <li>• Fill in the template with your data, then upload it in Step 2</li>
              </ul>
            </div>
          </div>

          {/* Step 2: Upload File */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <Upload className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 2: Upload Your Excel File</h3>
                <p className="text-sm text-gray-600">Upload the completed Excel file with your data</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">Excel files (.xlsx, .xls)</p>
              </label>

              {file && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-green-600">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Data Preview */}
          {showPreview && parsedData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Step 3: Preview & Import</h3>
                    <p className="text-sm text-gray-600">Review your data before importing</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Errors */}
              {parsedData.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900 mb-2">Found {parsedData.errors.length} Errors:</h4>
                      <ul className="text-sm text-red-800 space-y-1 max-h-40 overflow-y-auto">
                        {parsedData.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                      <p className="text-sm text-red-700 mt-2">Please fix these errors in your Excel file and re-upload.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{parsedData.income.length}</div>
                  <div className="text-sm text-green-700">Income Records</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">{parsedData.expenses.length}</div>
                  <div className="text-sm text-red-700">Expense Records</div>
                </div>
              </div>

              {/* Import Button */}
              {parsedData.errors.length === 0 && (parsedData.income.length > 0 || parsedData.expenses.length > 0) && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5" />
                      <span>Import to Database</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
