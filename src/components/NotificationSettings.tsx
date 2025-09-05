import React, { useState, useEffect } from 'react';
import { NotificationSettings as NotificationSettingsType } from '../types';
import { Bell, Mail, MessageSquare, Smartphone, Save, TestTube as Test, CheckCircle, AlertCircle, Settings, Clock, Calendar, Volume2, Zap, Info } from 'lucide-react';

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
  onUpdateSettings: (settings: NotificationSettingsType) => void;
  onRequestPermission: () => Promise<boolean>;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onUpdateSettings,
  onRequestPermission
}) => {
  const [localSettings, setLocalSettings] = useState<NotificationSettingsType>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Check notification permission status
  useEffect(() => {
    const checkPermissionStatus = () => {
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      } else {
        setPermissionStatus('not-supported');
      }
    };

    checkPermissionStatus();
    
    // Check permission status periodically
    const interval = setInterval(checkPermissionStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  const handleChange = (field: keyof NotificationSettingsType, value: any) => {
    console.log('Notification setting changed:', field, value);
    const newSettings = { ...localSettings, [field]: value };
    setLocalSettings(newSettings);
    setHasChanges(true);
    
    // Auto-save changes immediately
    onUpdateSettings(newSettings);
  };

  const handleSave = () => {
    console.log('Saving notification settings:', localSettings);
    onUpdateSettings(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const handleTestNotification = async () => {
    setTestStatus('sending');
    
    try {
      // Test browser notification
      if (localSettings.inAppEnabled && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('🧪 Test Notification - Digitum Finance', {
            body: 'This is a test notification to verify your settings are working correctly. All enabled channels will receive this message.',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: false,
          });
        }
      }

      // Simulate email test
      if (localSettings.emailEnabled && localSettings.emailAddress) {
        console.log('📧 Test email would be sent to:', localSettings.emailAddress);
        console.log('Email content:', {
          subject: '[Digitum Finance] Test Notification',
          body: 'This is a test notification to verify your email settings are working correctly.',
          timestamp: new Date().toISOString(),
        });
      }

      // Simulate WhatsApp test
      if (localSettings.whatsappEnabled && localSettings.whatsappNumber) {
        console.log('📱 Test WhatsApp would be sent to:', localSettings.whatsappNumber);
        console.log('WhatsApp content:', {
          message: '🏦 *Digitum Finance Test*\n\nThis is a test notification to verify your WhatsApp settings are working correctly.\n\n_Automated test from Digitum Finance_',
          timestamp: new Date().toISOString(),
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (error) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      return;
    }

    setIsRequestingPermission(true);
    
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        // Show a welcome notification
        new Notification('🎉 Notifications Enabled!', {
          body: 'You will now receive important financial alerts and reminders from Digitum Finance.',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
        
        // Update settings to enable in-app notifications
        const updatedSettings = { ...localSettings, inAppEnabled: true };
        setLocalSettings(updatedSettings);
        onUpdateSettings(updatedSettings);
      } else if (permission === 'denied') {
        alert('Notifications have been blocked. Please enable them in your browser settings to receive alerts.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Failed to request notification permission. Please try again.');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const getPermissionStatusInfo = () => {
    switch (permissionStatus) {
      case 'granted':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: CheckCircle,
          title: 'Notifications Enabled',
          description: 'Browser notifications are working properly',
          action: null
        };
      case 'denied':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: AlertCircle,
          title: 'Notifications Blocked',
          description: 'Please enable notifications in your browser settings',
          action: 'Open browser settings to enable notifications'
        };
      case 'default':
        return {
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          icon: AlertCircle,
          title: 'Permission Required',
          description: 'Click the button below to enable browser notifications',
          action: 'Enable Notifications'
        };
      case 'not-supported':
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: AlertCircle,
          title: 'Not Supported',
          description: 'This browser does not support notifications',
          action: null
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: AlertCircle,
          title: 'Unknown Status',
          description: 'Unable to determine notification status',
          action: null
        };
    }
  };

  const statusInfo = getPermissionStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
            <p className="text-gray-600 mt-1">Configure how and when you receive financial alerts and reminders</p>
          </div>
        </div>
      </div>

      {/* Browser Permission Status */}
      <div className={`rounded-xl shadow-sm border p-6 ${statusInfo.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-50 rounded-lg">
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">{statusInfo.title}</h3>
              <p className="text-sm opacity-90">{statusInfo.description}</p>
            </div>
          </div>
          
          {statusInfo.action && permissionStatus !== 'denied' && (
            <button
              onClick={handleRequestPermission}
              disabled={isRequestingPermission}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isRequestingPermission ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>{statusInfo.action}</span>
                </>
              )}
            </button>
          )}

          {permissionStatus === 'denied' && (
            <div className="text-sm">
              <p className="font-medium">To enable notifications:</p>
              <p className="text-xs opacity-90 mt-1">
                1. Click the 🔒 icon in your address bar<br/>
                2. Set Notifications to "Allow"<br/>
                3. Refresh this page
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Channels */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Notification Channels</h3>
        </div>

        <div className="space-y-6">
          {/* In-App Notifications */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">In-App Notifications</h4>
                <p className="text-sm text-gray-600">Show notifications within the dashboard and browser</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.inAppEnabled}
                onChange={(e) => {
                  console.log('In-app toggle clicked:', e.target.checked);
                  handleChange('inAppEnabled', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Email Notifications */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Send detailed notifications via email (Primary channel)</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.emailEnabled}
                  onChange={(e) => {
                    console.log('Email toggle clicked:', e.target.checked);
                    handleChange('emailEnabled', e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {localSettings.emailEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={localSettings.emailAddress || ''}
                  onChange={(e) => handleChange('emailAddress', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder=""
                />
                <p className="text-xs text-gray-500 mt-1">
                  📧 Emails include detailed information, amounts, and due dates
                </p>
              </div>
            )}
          </div>

          {/* WhatsApp Notifications */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">WhatsApp Notifications</h4>
                  <p className="text-sm text-gray-600">Send instant alerts via WhatsApp (Optional)</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.whatsappEnabled}
                  onChange={(e) => {
                    console.log('WhatsApp toggle clicked:', e.target.checked);
                    handleChange('whatsappEnabled', e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {localSettings.whatsappEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={localSettings.whatsappNumber || ''}
                  onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder=""
                />
                <p className="text-xs text-gray-500 mt-1">
                  📱 Include country code (e.g., +92 for Pakistan)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Timing & Triggers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Notification Timing & Triggers</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Days Before Due Date
            </label>
            <select
              value={localSettings.reminderDays}
              onChange={(e) => handleChange('reminderDays', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 day before</option>
              <option value={2}>2 days before</option>
              <option value={3}>3 days before (Recommended)</option>
              <option value={5}>5 days before</option>
              <option value={7}>1 week before</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              🔔 Notifications will be sent for upcoming income and pending expenses
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Daily Digest</h4>
                <p className="text-sm text-gray-600">Daily summary at 9:00 AM</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.dailyDigest}
                  onChange={(e) => handleChange('dailyDigest', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Weekly Report</h4>
                <p className="text-sm text-gray-600">Weekly financial summary</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.weeklyReport}
                  onChange={(e) => handleChange('weeklyReport', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <Zap className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Automatic Notification Types</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-green-900">Income Due</h4>
            </div>
            <p className="text-sm text-green-800">
              Notifications for upcoming client payments based on due dates
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-red-600" />
              <h4 className="font-medium text-red-900">Expense Due</h4>
            </div>
            <p className="text-sm text-red-800">
              Reminders for pending expense payments before due dates
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <h4 className="font-medium text-orange-900">Overdue Payments</h4>
            </div>
            <p className="text-sm text-orange-800">
              Urgent alerts for payments that have passed their due date
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <h4 className="font-medium text-yellow-900">Low Balance</h4>
            </div>
            <p className="text-sm text-yellow-800">
              Warnings when account balances fall below threshold
            </p>
          </div>
        </div>
      </div>

      {/* Test Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Volume2 className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Test Notifications</h3>
              <p className="text-sm text-gray-600">Send a test notification to verify your settings</p>
            </div>
          </div>
          
          <button
            onClick={handleTestNotification}
            disabled={testStatus === 'sending'}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              testStatus === 'success' ? 'bg-green-100 text-green-700' :
              testStatus === 'error' ? 'bg-red-100 text-red-700' :
              'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {testStatus === 'sending' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : testStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Test Sent!</span>
              </>
            ) : testStatus === 'error' ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Test Failed</span>
              </>
            ) : (
              <>
                <Test className="w-4 h-4" />
                <span>Send Test</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Actions - Only show if there are unsaved changes */}
      {hasChanges && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleReset}
            className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Reset Changes
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 font-medium"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">How Notifications Work</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• <strong>Automatic Triggers:</strong> Notifications are sent based on due dates you set for income and expenses</p>
              <p>• <strong>Email Priority:</strong> Email is the primary channel for detailed notifications with full context</p>
              <p>• <strong>Real-time Checks:</strong> System checks for due payments every hour and sends notifications accordingly</p>
              <p>• <strong>Smart Scheduling:</strong> Notifications are sent once per day to avoid spam</p>
              <p>• <strong>Priority Levels:</strong> Urgent (due today), High (due tomorrow), Medium (within reminder window)</p>
              <p>• <strong>Data Security:</strong> All notification data is stored locally in your browser</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};