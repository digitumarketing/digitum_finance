import React, { useState } from 'react';
import { Notification, NotificationPriority } from '../types';
import { formatDate, formatCurrency } from '../utils/helpers';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  Info, 
  DollarSign,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Filter,
  BellRing,
  Zap,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | NotificationPriority>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  const getPriorityIcon = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent': return <Zap className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Info className="w-4 h-4 text-blue-600" />;
      case 'low': return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income_due': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'expense_due': return <Calendar className="w-4 h-4 text-red-600" />;
      case 'payment_overdue': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'low_balance': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'system': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income_due': return 'Income Due';
      case 'expense_due': return 'Expense Due';
      case 'payment_overdue': return 'Overdue';
      case 'low_balance': return 'Low Balance';
      case 'system': return 'System';
      default: return 'Notification';
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(notif => notif.priority === filter);

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
    }
    
    // Sort by read status (unread first), then by date
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.isRead).length;
  const highCount = notifications.filter(n => n.priority === 'high' && !n.isRead).length;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className="relative">
          {urgentCount > 0 ? (
            <BellRing className="w-6 h-6 text-red-600 animate-pulse" />
          ) : (
            <Bell className="w-6 h-6" />
          )}
          
          {unreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium ${
              urgentCount > 0 ? 'bg-red-500 animate-pulse' : 
              highCount > 0 ? 'bg-orange-500' : 'bg-blue-500'
            }`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    urgentCount > 0 ? 'bg-red-100 text-red-800' :
                    highCount > 0 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Priority Summary */}
            {(urgentCount > 0 || highCount > 0) && (
              <div className="mt-3 flex items-center space-x-3 text-xs">
                {urgentCount > 0 && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <Zap className="w-3 h-3" />
                    <span>{urgentCount} urgent</span>
                  </div>
                )}
                {highCount > 0 && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{highCount} high priority</span>
                  </div>
                )}
              </div>
            )}

            {/* Filter and Actions */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as NotificationPriority | 'all')}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">By Date</option>
                  <option value="priority">By Priority</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Mark all as read clicked');
                      onMarkAllAsRead();
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clear all clicked');
                      onClearAll();
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {sortedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications</p>
                <p className="text-sm text-gray-400 mt-1">
                  {filter === 'all' ? 'All caught up!' : `No ${filter} priority notifications`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sortedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.isRead ? 'bg-opacity-50' : 'bg-opacity-20'
                    } hover:bg-opacity-70 transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex items-center space-x-1 mt-1">
                          {getTypeIcon(notification.type)}
                          {getPriorityIcon(notification.priority)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{formatDate(notification.createdAt)}</span>
                              
                              <span className="flex items-center space-x-1">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span>{getTypeLabel(notification.type)}</span>
                              </span>
                              
                              {notification.metadata?.amount && (
                                <span className="flex items-center space-x-1 text-green-600">
                                  <DollarSign className="w-3 h-3" />
                                  <span>{formatCurrency(notification.metadata.amount, notification.metadata.currency)}</span>
                                </span>
                              )}
                            </div>
                            
                            {notification.channels.length > 0 && (
                              <div className="flex items-center space-x-1">
                                {notification.channels.includes('email') && (
                                  <Mail className="w-3 h-3 text-blue-500" title="Email sent" />
                                )}
                                {notification.channels.includes('whatsapp') && (
                                  <MessageSquare className="w-3 h-3 text-green-500" title="WhatsApp sent" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Additional metadata display */}
                          {notification.metadata && (
                            <div className="mt-2 text-xs text-gray-500">
                              {notification.metadata.clientName && (
                                <div>Client: {notification.metadata.clientName}</div>
                              )}
                              {notification.metadata.account && (
                                <div>Account: {notification.metadata.account}</div>
                              )}
                              {notification.metadata.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Due: {new Date(notification.metadata.dueDate).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Mark as read clicked for:', notification.id);
                              onMarkAsRead(notification.id);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Delete clicked for:', notification.id);
                            onDelete(notification.id);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{filteredNotifications.length} of {notifications.length} notifications</span>
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-3 h-3" />
                  <span>Auto-refresh enabled</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};