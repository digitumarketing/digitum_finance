import React, { useState, useRef, useEffect } from 'react';
import { Income, Expense, Account, Currency, IncomeCategory, ExpenseCategory, IncomeStatus, PaymentStatus, AccountName, getAccountCurrencyMap } from '../types';
import { formatCurrency, formatDate, generateId } from '../utils/helpers';
import { 
  Database, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Eye,
  Loader,
  Info,
  ArrowRight,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  Trash2,
  DollarSign
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
}

interface PreviewData {
  type: 'income' | 'expense' | 'account';
  data: any[];
  errors: string[];
  warnings: string[];
}

interface DataManagementProps {
  income: Income[];
  expenses: Expense[];
  accounts: Account[];
  exchangeRates: Record<string, number>;
  addIncome: (data: any) => void;
  addExpense: (data: any) => void;
  updateAccountBalance: (id: string, newBalance: number) => void;
  refreshData: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({
  income = [],
  expenses = [],
  accounts = [],
  exchangeRates = {},
  addIncome,
  addExpense,
  updateAccountBalance,
  refreshData
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<{
    income?: PreviewData;
    expense?: PreviewData;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export functions
  const exportToExcel = async (dataType: 'income' | 'expenses' | 'accounts' | 'all') => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      if (dataType === 'income' || dataType === 'all') {
        const incomeData = income.map(item => ({
          'Date': formatDate(item.date),
          'Client Name': item.clientName,
          'Description': item.description,
          'Category': item.category,
          'Account': item.account,
          'Original Amount': item.originalAmount,
          'Currency': item.currency,
          'Received Amount': item.receivedAmount,
          'PKR Equivalent': item.convertedAmount,
          'Split Amount PKR': item.splitAmountPKR,
          'Exchange Rate Used': item.splitRateUsed,
          'Status': item.status,
          'Due Date': item.dueDate || '',
          'Notes': item.notes || '',
          'Created At': formatDate(item.createdAt),
          'Updated At': formatDate(item.updatedAt)
        }));
        const ws = XLSX.utils.json_to_sheet(incomeData);
        XLSX.utils.book_append_sheet(wb, ws, 'Income');
      }

      if (dataType === 'expenses' || dataType === 'all') {
        const expenseData = expenses.map(item => ({
          'Date': formatDate(item.date),
          'Description': item.description,
          'Category': item.category,
          'Account': item.account,
          'Amount': item.amount,
          'Currency': item.currency,
          'PKR Equivalent': item.convertedAmount,
          'Payment Status': item.paymentStatus,
          'Due Date': item.dueDate || '',
          'Notes': item.notes || '',
          'Created At': formatDate(item.createdAt),
          'Updated At': formatDate(item.updatedAt)
        }));
        const ws = XLSX.utils.json_to_sheet(expenseData);
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
      }

      if (dataType === 'accounts' || dataType === 'all') {
        const accountData = accounts.map(item => ({
          'Account Name': item.name,
          'Currency': item.currency,
          'Balance': item.balance,
          'PKR Equivalent': item.convertedBalance,
          'Last Updated': formatDate(item.lastUpdated),
          'Notes': item.notes || ''
        }));
        const ws = XLSX.utils.json_to_sheet(accountData);
        XLSX.utils.book_append_sheet(wb, ws, 'Accounts');
      }

      // Add metadata sheet
      const metadata = [{
        'Export Date': new Date().toISOString(),
        'Export Type': dataType,
        'Total Income Records': income.length,
        'Total Expense Records': expenses.length,
        'Total Accounts': accounts.length,
        'Exchange Rates': JSON.stringify(exchangeRates)
      }];
      const metaWs = XLSX.utils.json_to_sheet(metadata);
      XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');

      const fileName = `Digitum_Finance_${dataType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async (dataType: 'income' | 'expenses' | 'accounts') => {
    setIsExporting(true);
    try {
      let data: any[] = [];
      let fileName = '';

      switch (dataType) {
        case 'income':
          data = income.map(item => ({
            date: item.date,
            clientName: item.clientName,
            description: item.description,
            category: item.category,
            account: item.account,
            originalAmount: item.originalAmount,
            currency: item.currency,
            receivedAmount: item.receivedAmount,
            pkriEquivalent: item.convertedAmount,
            splitAmountPKR: item.splitAmountPKR,
            exchangeRateUsed: item.splitRateUsed,
            status: item.status,
            dueDate: item.dueDate || '',
            notes: item.notes || '',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }));
          fileName = `Digitum_Income_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'expenses':
          data = expenses.map(item => ({
            date: item.date,
            description: item.description,
            category: item.category,
            account: item.account,
            amount: item.amount,
            currency: item.currency,
            pkriEquivalent: item.convertedAmount,
            paymentStatus: item.paymentStatus,
            dueDate: item.dueDate || '',
            notes: item.notes || '',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }));
          fileName = `Digitum_Expenses_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'accounts':
          data = accounts.map(item => ({
            accountName: item.name,
            currency: item.currency,
            balance: item.balance,
            pkriEquivalent: item.convertedBalance,
            lastUpdated: item.lastUpdated,
            notes: item.notes || ''
          }));
          fileName = `Digitum_Accounts_${new Date().toISOString().split('T')[0]}.csv`;
          break;
      }

      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Import functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    setPreviewData(null);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      handleExcelImport(file);
    } else if (fileExtension === 'csv') {
      handleCSVImport(file);
    } else {
      setImportResult({
        success: false,
        imported: 0,
        errors: ['Unsupported file format. Please use Excel (.xlsx, .xls) or CSV (.csv) files.'],
        warnings: []
      });
      setIsImporting(false);
    }
  };

  const handleExcelImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Check for multiple sheets
        const sheetNames = workbook.SheetNames;
        const preview: {income?: PreviewData, expense?: PreviewData} = {};
        
        // Process Income sheet if it exists
        const incomeSheetName = sheetNames.find(name => 
          name.toLowerCase() === 'income' || 
          name.toLowerCase().includes('income')
        );
        
        if (incomeSheetName) {
          const incomeSheet = workbook.Sheets[incomeSheetName];
          const incomeData = XLSX.utils.sheet_to_json(incomeSheet);
          const processedIncome = processImportData(incomeData, 'income');
          preview.income = processedIncome;
        }
        
        // Process Expense sheet if it exists
        const expenseSheetName = sheetNames.find(name => 
          name.toLowerCase() === 'expense' || 
          name.toLowerCase() === 'expenses' || 
          name.toLowerCase().includes('expense')
        );
        
        if (expenseSheetName) {
          const expenseSheet = workbook.Sheets[expenseSheetName];
          const expenseData = XLSX.utils.sheet_to_json(expenseSheet);
          const processedExpense = processImportData(expenseData, 'expense');
          preview.expense = processedExpense;
        }
        
        // If no specific sheets found, try to detect from first sheet
        if (!incomeSheetName && !expenseSheetName && sheetNames.length > 0) {
          const firstSheet = workbook.Sheets[sheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          // Try to detect data type from headers
          const headers = Object.keys(jsonData[0] || {}).map(h => h.toLowerCase());
          
          if (headers.includes('clientname') || headers.includes('client name') || headers.includes('client')) {
            const processedIncome = processImportData(jsonData, 'income');
            preview.income = processedIncome;
          } else if (headers.includes('paymentstatus') || headers.includes('payment status')) {
            const processedExpense = processImportData(jsonData, 'expense');
            preview.expense = processedExpense;
          } else {
            // Try to process as both and see which one has fewer errors
            const asIncome = processImportData(jsonData, 'income');
            const asExpense = processImportData(jsonData, 'expense');
            
            if (asIncome.errors.length <= asExpense.errors.length) {
              preview.income = asIncome;
            } else {
              preview.expense = asExpense;
            }
          }
        }
        
        if (Object.keys(preview).length === 0) {
          setImportResult({
            success: false,
            imported: 0,
            errors: ['Could not detect valid income or expense data in the file.'],
            warnings: []
          });
          setIsImporting(false);
        } else {
          setPreviewData(preview);
          setShowPreview(true);
          setIsImporting(false);
        }
      } catch (error) {
        setImportResult({
          success: false,
          imported: 0,
          errors: [`Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: []
        });
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCSVImport = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          // Try to detect data type from headers
          const headers = Object.keys(results.data[0] || {}).map(h => h.toLowerCase());
          let dataType: 'income' | 'expense' = 'income';
          
          if (headers.includes('clientname') || headers.includes('client name') || headers.includes('client')) {
            dataType = 'income';
          } else if (headers.includes('paymentstatus') || headers.includes('payment status')) {
            dataType = 'expense';
          } else {
            // Try to process as both and see which one has fewer errors
            const asIncome = processImportData(results.data, 'income');
            const asExpense = processImportData(results.data, 'expense');
            
            if (asIncome.errors.length <= asExpense.errors.length) {
              dataType = 'income';
            } else {
              dataType = 'expense';
            }
          }

          const processed = processImportData(results.data, dataType);
          
          if (dataType === 'income') {
            setPreviewData({ income: processed });
          } else {
            setPreviewData({ expense: processed });
          }
          
          setShowPreview(true);
          setIsImporting(false);
        } catch (error) {
          setImportResult({
            success: false,
            imported: 0,
            errors: [`Failed to process CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`],
            warnings: []
          });
          setIsImporting(false);
        }
      },
      error: (error) => {
        setImportResult({
          success: false,
          imported: 0,
          errors: [`Failed to parse CSV file: ${error.message}`],
          warnings: []
        });
        setIsImporting(false);
      }
    });
  };

  const processImportData = (data: any[], dataType: 'income' | 'expense' | 'account'): PreviewData => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const processedData: any[] = [];

    // Skip empty rows
    const nonEmptyData = data.filter(row => {
      return Object.keys(row).length > 0 && Object.values(row).some(val => val !== null && val !== undefined && val !== '');
    });

    nonEmptyData.forEach((row, index) => {
      try {
        if (dataType === 'income') {
          const processed = processIncomeRow(row, index + 1);
          if (processed.errors.length > 0) {
            errors.push(...processed.errors);
          }
          if (processed.warnings.length > 0) {
            warnings.push(...processed.warnings);
          }
          if (processed.data) {
            processedData.push(processed.data);
          }
        } else if (dataType === 'expense') {
          const processed = processExpenseRow(row, index + 1);
          if (processed.errors.length > 0) {
            errors.push(...processed.errors);
          }
          if (processed.warnings.length > 0) {
            warnings.push(...processed.warnings);
          }
          if (processed.data) {
            processedData.push(processed.data);
          }
        } else if (dataType === 'account') {
          const processed = processAccountRow(row, index + 1);
          if (processed.errors.length > 0) {
            errors.push(...processed.errors);
          }
          if (processed.warnings.length > 0) {
            warnings.push(...processed.warnings);
          }
          if (processed.data) {
            processedData.push(processed.data);
          }
        }
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    return {
      type: dataType,
      data: processedData,
      errors,
      warnings
    };
  };

  const processIncomeRow = (row: any, rowNumber: number) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Map common field variations
    const getField = (variations: string[]) => {
      for (const variation of variations) {
        if (row[variation] !== undefined && row[variation] !== null && row[variation] !== '') {
          return row[variation];
        }
      }
      return null;
    };

    const date = getField(['date', 'Date', 'DATE', 'transaction_date', 'Transaction Date']);
    const clientName = getField(['clientName', 'client name', 'Client Name', 'CLIENT_NAME', 'client', 'Client']);
    const description = getField(['description', 'Description', 'DESCRIPTION', 'desc', 'Desc']);
    const category = getField(['category', 'Category', 'CATEGORY', 'type', 'Type']);
    const account = getField(['account', 'Account', 'ACCOUNT', 'account_name', 'Account Name']);
    const originalAmount = getField(['originalAmount', 'original amount', 'Original Amount', 'amount', 'Amount', 'AMOUNT']);
    const currency = getField(['currency', 'Currency', 'CURRENCY', 'curr', 'Curr']);
    const status = getField(['status', 'Status', 'STATUS', 'payment_status', 'Payment Status']);
    const receivedAmount = getField(['receivedAmount', 'received amount', 'Received Amount', 'received', 'Received']);
    const dueDate = getField(['dueDate', 'due date', 'Due Date', 'due', 'Due']);
    const notes = getField(['notes', 'Notes', 'NOTES', 'note', 'Note', 'comments', 'Comments']);

    // Validation
    if (!date) errors.push(`Row ${rowNumber}: Date is required`);
    if (!clientName) errors.push(`Row ${rowNumber}: Client name is required`);
    if (!description) errors.push(`Row ${rowNumber}: Description is required`);
    if (!originalAmount || isNaN(parseFloat(originalAmount))) {
      errors.push(`Row ${rowNumber}: Valid original amount is required`);
    }

    // Set defaults and validate
    const finalCurrency = currency || 'PKR';
    const finalCategory = category || 'Others';
    const finalAccount = account || 'Bank Alfalah';
    const finalStatus = status || 'Received';

    // Validate account exists
    if (!accounts.some(a => a.name === finalAccount)) {
      warnings.push(`Row ${rowNumber}: Account '${finalAccount}' not found, will be skipped`);
      return { data: null, errors, warnings };
    }

    // Validate currency
    if (!exchangeRates.hasOwnProperty(finalCurrency)) {
      warnings.push(`Row ${rowNumber}: Currency '${finalCurrency}' not found in exchange rates, defaulting to PKR`);
    }

    if (errors.length > 0) {
      return { data: null, errors, warnings };
    }

    // Parse date
    let parsedDate = date;
    if (typeof date === 'string') {
      // Handle different date formats
      if (date.includes('/')) {
        // MM/DD/YYYY format
        const parts = date.split('/');
        if (parts.length === 3) {
          parsedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      } else if (date.includes('-')) {
        // Already in YYYY-MM-DD format
        parsedDate = date;
      } else {
        // Try to parse as date object
        try {
          const dateObj = new Date(date);
          parsedDate = dateObj.toISOString().split('T')[0];
        } catch (e) {
          warnings.push(`Row ${rowNumber}: Date format could not be parsed, using as-is`);
        }
      }
    }

    // Calculate PKR conversion
    const amount = parseFloat(originalAmount);
    const rate = finalCurrency === 'PKR' ? 1 : exchangeRates[finalCurrency] || 1;
    const convertedAmount = amount * rate;

    // Calculate received amount
    let finalReceivedAmount = amount;
    if (finalStatus === 'Partial' && receivedAmount !== null) {
      finalReceivedAmount = parseFloat(receivedAmount);
    } else if (finalStatus === 'Upcoming' || finalStatus === 'Cancelled') {
      finalReceivedAmount = 0;
    }

    // Calculate converted received amount
    const receivedConvertedAmount = finalStatus === 'Partial' || finalStatus === 'Received' 
      ? finalReceivedAmount * rate 
      : 0;

    const incomeData = {
      date: parsedDate,
      originalAmount: amount,
      currency: finalCurrency,
      receivedAmount: finalReceivedAmount,
      convertedAmount: receivedConvertedAmount,
      originalConvertedAmount: convertedAmount,
      category: finalCategory,
      description,
      clientName,
      notes: notes || '',
      status: finalStatus,
      account: finalAccount,
      splitAmountPKR: receivedConvertedAmount,
      splitRateUsed: rate,
      dueDate: dueDate || undefined
    };

    return { data: incomeData, errors, warnings };
  };

  const processExpenseRow = (row: any, rowNumber: number) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const getField = (variations: string[]) => {
      for (const variation of variations) {
        if (row[variation] !== undefined && row[variation] !== null && row[variation] !== '') {
          return row[variation];
        }
      }
      return null;
    };

    const date = getField(['date', 'Date', 'DATE', 'transaction_date', 'Transaction Date']);
    const description = getField(['description', 'Description', 'DESCRIPTION', 'desc', 'Desc']);
    const category = getField(['category', 'Category', 'CATEGORY', 'type', 'Type']);
    const account = getField(['account', 'Account', 'ACCOUNT', 'account_name', 'Account Name']);
    const amount = getField(['amount', 'Amount', 'AMOUNT', 'expense_amount', 'Expense Amount']);
    const currency = getField(['currency', 'Currency', 'CURRENCY', 'curr', 'Curr']);
    const paymentStatus = getField(['paymentStatus', 'payment status', 'Payment Status', 'status', 'Status']);
    const dueDate = getField(['dueDate', 'due date', 'Due Date', 'due', 'Due']);
    const notes = getField(['notes', 'Notes', 'NOTES', 'note', 'Note', 'comments', 'Comments']);

    // Validation
    if (!date) errors.push(`Row ${rowNumber}: Date is required`);
    if (!description) errors.push(`Row ${rowNumber}: Description is required`);
    if (!amount || isNaN(parseFloat(amount))) {
      errors.push(`Row ${rowNumber}: Valid amount is required`);
    }

    // Set defaults
    const finalCurrency = currency || 'PKR';
    const finalCategory = category || 'Other';
    const finalAccount = account || 'Bank Alfalah';
    const finalPaymentStatus = paymentStatus || 'Done';

    // Validate account exists
    if (!accounts.some(a => a.name === finalAccount)) {
      warnings.push(`Row ${rowNumber}: Account '${finalAccount}' not found, will be skipped`);
      return { data: null, errors, warnings };
    }

    // Validate currency
    if (!exchangeRates.hasOwnProperty(finalCurrency)) {
      warnings.push(`Row ${rowNumber}: Currency '${finalCurrency}' not found in exchange rates, defaulting to PKR`);
    }

    if (errors.length > 0) {
      return { data: null, errors, warnings };
    }

    // Parse date
    let parsedDate = date;
    if (typeof date === 'string') {
      // Handle different date formats
      if (date.includes('/')) {
        // MM/DD/YYYY format
        const parts = date.split('/');
        if (parts.length === 3) {
          parsedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      } else if (date.includes('-')) {
        // Already in YYYY-MM-DD format
        parsedDate = date;
      } else {
        // Try to parse as date object
        try {
          const dateObj = new Date(date);
          parsedDate = dateObj.toISOString().split('T')[0];
        } catch (e) {
          warnings.push(`Row ${rowNumber}: Date format could not be parsed, using as-is`);
        }
      }
    }

    // Calculate PKR conversion
    const expenseAmount = parseFloat(amount);
    const rate = finalCurrency === 'PKR' ? 1 : exchangeRates[finalCurrency] || 1;
    const convertedAmount = expenseAmount * rate;

    const expenseData = {
      date: parsedDate,
      amount: expenseAmount,
      currency: finalCurrency,
      convertedAmount,
      category: finalCategory,
      description,
      paymentStatus: finalPaymentStatus,
      notes: notes || '',
      account: finalAccount,
      dueDate: dueDate || undefined
    };

    return { data: expenseData, errors, warnings };
  };

  const processAccountRow = (row: any, rowNumber: number) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const getField = (variations: string[]) => {
      for (const variation of variations) {
        if (row[variation] !== undefined && row[variation] !== null && row[variation] !== '') {
          return row[variation];
        }
      }
      return null;
    };

    const accountName = getField(['accountName', 'account name', 'Account Name', 'name', 'Name']);
    const balance = getField(['balance', 'Balance', 'BALANCE', 'amount', 'Amount']);

    // Validation
    if (!accountName) errors.push(`Row ${rowNumber}: Account name is required`);
    if (!balance || isNaN(parseFloat(balance))) {
      errors.push(`Row ${rowNumber}: Valid balance is required`);
    }

    if (errors.length > 0) {
      return { data: null, errors, warnings };
    }

    const accountData = {
      name: accountName,
      balance: parseFloat(balance),
      notes: getField(['notes', 'Notes', 'NOTES', 'note', 'Note']) || ''
    };

    return { data: accountData, errors, warnings };
  };

  const confirmImport = () => {
    if (!previewData) return;

    let imported = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Import income data
      if (previewData.income && previewData.income.data.length > 0) {
        previewData.income.data.forEach((item, index) => {
          try {
            addIncome(item);
            imported++;
          } catch (error) {
            errors.push(`Failed to import income item ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });
        
        warnings.push(...previewData.income.warnings);
      }
      
      // Import expense data
      if (previewData.expense && previewData.expense.data.length > 0) {
        previewData.expense.data.forEach((item, index) => {
          try {
            addExpense(item);
            imported++;
          } catch (error) {
            errors.push(`Failed to import expense item ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });
        
        warnings.push(...previewData.expense.warnings);
      }

      setImportResult({
        success: imported > 0,
        imported,
        errors,
        warnings
      });
      
      // Refresh data to update all calculations
      refreshData();
    } catch (error) {
      setImportResult({
        success: false,
        imported: 0,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      });
    }

    setShowPreview(false);
    setPreviewData(null);
  };

  const handleDeleteAllData = () => {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    try {
      // Clear income and expenses
      localStorage.setItem('digitum_income', JSON.stringify([]));
      localStorage.setItem('digitum_expenses', JSON.stringify([]));
      
      // Reset account balances to zero but keep the accounts
      const resetAccounts = accounts.map(account => ({
        ...account,
        balance: 0,
        convertedBalance: 0,
        lastUpdated: new Date().toISOString()
      }));
      localStorage.setItem('digitum_accounts', JSON.stringify(resetAccounts));
      
      // Clear notifications
      localStorage.setItem('digitum_notifications', JSON.stringify([]));
      
      // Force refresh
      refreshData();
      
      // Close modal and reset
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      
      // Show success message
      setImportResult({
        success: true,
        imported: 0,
        errors: [],
        warnings: ['All transaction data has been deleted. Account structures have been preserved with zero balances.']
      });
    } catch (error) {
      setImportResult({
        success: false,
        imported: 0,
        errors: [`Failed to delete data: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      });
    }
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
            <h2 className="text-2xl font-bold text-gray-900">Data Management</h2>
            <p className="text-gray-600 mt-1">Import and export your financial data in Excel and CSV formats</p>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <Download className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
            <p className="text-sm text-gray-600">Download your financial data for backup or analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Excel Exports */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Excel Format</h4>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => exportToExcel('all')}
                disabled={isExporting}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isExporting ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>All Data</span>
              </button>
              <button
                onClick={() => exportToExcel('income')}
                disabled={isExporting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Income Only
              </button>
              <button
                onClick={() => exportToExcel('expenses')}
                disabled={isExporting}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Expenses Only
              </button>
              <button
                onClick={() => exportToExcel('accounts')}
                disabled={isExporting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Accounts Only
              </button>
            </div>
          </div>

          {/* CSV Exports */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">CSV Format</h4>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => exportToCSV('income')}
                disabled={isExporting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Income CSV
              </button>
              <button
                onClick={() => exportToCSV('expenses')}
                disabled={isExporting}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Expenses CSV
              </button>
              <button
                onClick={() => exportToCSV('accounts')}
                disabled={isExporting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Accounts CSV
              </button>
            </div>
          </div>

          {/* Data Summary */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <FileCheck className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Data Summary</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Income Records:</span>
                <span className="font-medium">{income.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expense Records:</span>
                <span className="font-medium">{expenses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accounts:</span>
                <span className="font-medium">{accounts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Records:</span>
                <span className="font-bold">{income.length + expenses.length + accounts.length}</span>
              </div>
            </div>
          </div>

          {/* Export Info */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Export Info</h4>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Excel files include all data with metadata</p>
              <p>• CSV files are optimized for spreadsheet apps</p>
              <p>• All amounts converted to PKR included</p>
              <p>• Exchange rates preserved in exports</p>
              <p>• Timestamps in ISO format</p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Upload className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Import Data</h3>
            <p className="text-sm text-gray-600">Upload Excel or CSV files to import financial data</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">Upload File</h4>
                <p className="text-sm text-gray-600">Drag and drop or click to select</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
              >
                {isImporting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Choose File</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500">
                Supports: .xlsx, .xls, .csv files
              </p>
            </div>
          </div>

          {/* Import Guidelines */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Import Guidelines</h4>
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• First row should contain column headers</p>
                <p>• Date format: YYYY-MM-DD or MM/DD/YYYY</p>
                <p>• Amounts should be numeric values</p>
                <p>• Currency codes must match your configured currencies</p>
                <p>• Missing fields will use default values</p>
                <p>• Excel files can have separate Income and Expense sheets</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <h4 className="font-medium text-yellow-900">Required Fields</h4>
              </div>
              <div className="text-sm text-yellow-800">
                <div className="space-y-2">
                  <div>
                    <strong>Income:</strong> Date, Client Name, Description, Amount
                  </div>
                  <div>
                    <strong>Expenses:</strong> Date, Description, Amount
                  </div>
                  <div>
                    <strong>Accounts:</strong> Account Name, Balance
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete All Data Section */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delete All Data</h3>
            <p className="text-sm text-red-600">Permanently remove all transaction data</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900 mb-2">Warning: Destructive Action</h4>
              <p className="text-sm text-red-800">
                This will permanently delete all income and expense records. Account structures will be preserved, but all balances will be reset to zero. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="w-full sm:w-2/3">
            <label className="block text-sm font-medium text-red-700 mb-1">
              Type "DELETE" to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full border border-red-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="DELETE"
            />
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteConfirmText !== 'DELETE'}
            className="w-full sm:w-1/3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All Data</span>
          </button>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`rounded-xl shadow-sm border p-6 ${
          importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            {importResult.success ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${
                importResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {importResult.success ? 'Import Completed' : 'Import Failed'}
              </h3>
              <p className={`text-sm ${
                importResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {importResult.imported} records imported successfully
              </p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
              <ul className="text-sm text-red-800 space-y-1 max-h-40 overflow-y-auto">
                {importResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {importResult.warnings.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-yellow-900 mb-2">Warnings:</h4>
              <ul className="text-sm text-yellow-800 space-y-1 max-h-40 overflow-y-auto">
                {importResult.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setImportResult(null)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Import Preview
                  </h3>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {(previewData.income?.data.length || 0) + (previewData.expense?.data.length || 0)} records ready to import
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Errors and Warnings */}
              {((previewData.income?.errors.length || 0) > 0 || (previewData.expense?.errors.length || 0) > 0) && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-800 space-y-1 max-h-20 overflow-y-auto">
                    {previewData.income?.errors.map((error, index) => (
                      <li key={`income-error-${index}`}>• {error}</li>
                    ))}
                    {previewData.expense?.errors.map((error, index) => (
                      <li key={`expense-error-${index}`}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {((previewData.income?.warnings.length || 0) > 0 || (previewData.expense?.warnings.length || 0) > 0) && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-900 mb-2">Warnings:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1 max-h-20 overflow-y-auto">
                    {previewData.income?.warnings.map((warning, index) => (
                      <li key={`income-warning-${index}`}>• {warning}</li>
                    ))}
                    {previewData.expense?.warnings.map((warning, index) => (
                      <li key={`expense-warning-${index}`}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Income Preview */}
              {previewData.income && previewData.income.data.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <div className="p-1 bg-green-100 rounded-full">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <span>Income Data ({previewData.income.data.length} records)</span>
                  </h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-2 py-1 text-left">Date</th>
                          <th className="px-2 py-1 text-left">Client</th>
                          <th className="px-2 py-1 text-left">Description</th>
                          <th className="px-2 py-1 text-left">Amount</th>
                          <th className="px-2 py-1 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.income.data.slice(0, 5).map((item, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="px-2 py-1">{item.date}</td>
                            <td className="px-2 py-1">{item.clientName}</td>
                            <td className="px-2 py-1">{item.description}</td>
                            <td className="px-2 py-1">{formatCurrency(item.originalAmount, item.currency)}</td>
                            <td className="px-2 py-1">{item.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.income.data.length > 5 && (
                      <p className="text-gray-500 text-center text-xs mt-2">
                        ... and {previewData.income.data.length - 5} more records
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Expense Preview */}
              {previewData.expense && previewData.expense.data.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <div className="p-1 bg-red-100 rounded-full">
                      <DollarSign className="w-4 h-4 text-red-600" />
                    </div>
                    <span>Expense Data ({previewData.expense.data.length} records)</span>
                  </h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-2 py-1 text-left">Date</th>
                          <th className="px-2 py-1 text-left">Description</th>
                          <th className="px-2 py-1 text-left">Category</th>
                          <th className="px-2 py-1 text-left">Amount</th>
                          <th className="px-2 py-1 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.expense.data.slice(0, 5).map((item, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="px-2 py-1">{item.date}</td>
                            <td className="px-2 py-1">{item.description}</td>
                            <td className="px-2 py-1">{item.category}</td>
                            <td className="px-2 py-1">{formatCurrency(item.amount, item.currency)}</td>
                            <td className="px-2 py-1">{item.paymentStatus}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.expense.data.length > 5 && (
                      <p className="text-gray-500 text-center text-xs mt-2">
                        ... and {previewData.expense.data.length - 5} more records
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* No Valid Data */}
              {(!previewData.income || previewData.income.data.length === 0) && 
               (!previewData.expense || previewData.expense.data.length === 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <p className="text-yellow-800">No valid data found to import. Please check your file format and try again.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={(!previewData.income || previewData.income.data.length === 0) && 
                          (!previewData.expense || previewData.expense.data.length === 0)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Import {(previewData.income?.data.length || 0) + (previewData.expense?.data.length || 0)} Records</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-red-50 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Data Deletion</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium">You are about to delete:</p>
                <ul className="text-red-700 text-sm mt-2 space-y-1">
                  <li>• All income records ({income.length} entries)</li>
                  <li>• All expense records ({expenses.length} entries)</li>
                  <li>• All account balances will be reset to zero</li>
                  <li>• All notifications will be cleared</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllData}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};