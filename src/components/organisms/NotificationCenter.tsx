/**
 * Notification Center Component
 *
 * Displays notifications with filtering, mark as read, and preferences.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  X,
  MessageSquare,
  Calendar,
  FileText,
  CreditCard,
  Wrench,
  Shield,
  Home,
  Loader2,
} from 'lucide-react';
import {
  pushNotificationService,
  type StoredNotification,
  type NotificationType,
  type NotificationPreferences,
} from '../../services/PushNotificationService';
import { useAuthStore } from '../../hooks/useAuthStore';

// =====================================================
// TYPES
// =====================================================

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick?: (notification: StoredNotification) => void;
}

type FilterType = 'all' | 'unread' | NotificationType;

// =====================================================
// ICON MAPPING
// =====================================================

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'new_match':
      return <Home className="w-5 h-5 text-green-500" />;
    case 'new_message':
      return <MessageSquare className="w-5 h-5 text-blue-500" />;
    case 'viewing_request':
    case 'viewing_confirmed':
    case 'viewing_reminder':
      return <Calendar className="w-5 h-5 text-purple-500" />;
    case 'document_request':
    case 'document_received':
      return <FileText className="w-5 h-5 text-orange-500" />;
    case 'payment_due':
    case 'payment_received':
      return <CreditCard className="w-5 h-5 text-emerald-500" />;
    case 'maintenance_update':
      return <Wrench className="w-5 h-5 text-yellow-500" />;
    case 'verification_complete':
      return <Shield className="w-5 h-5 text-cyan-500" />;
    case 'system':
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

// =====================================================
// NOTIFICATION CENTER COMPONENT
// =====================================================

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNotificationClick,
}) => {
  const { currentUser } = useAuthStore();
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  const loadNotifications = useCallback(async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    try {
      const [notifs, prefs] = await Promise.all([
        pushNotificationService.getNotifications(currentUser.id),
        pushNotificationService.getPreferences(currentUser.id),
      ]);
      setNotifications(notifs);
      setPreferences(prefs);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // =====================================================
  // ACTIONS
  // =====================================================

  const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await pushNotificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.id) return;
    await pushNotificationService.markAllAsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await pushNotificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (notification: StoredNotification) => {
    if (!notification.read) {
      pushNotificationService.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }
    onNotificationClick?.(notification);
  };

  const handlePreferenceChange = async (
    key: keyof NotificationPreferences,
    value: unknown
  ) => {
    if (!currentUser?.id || !preferences) return;

    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    await pushNotificationService.updatePreferences(currentUser.id, { [key]: value });
  };

  const handleTypeToggle = async (type: NotificationType) => {
    if (!currentUser?.id || !preferences) return;

    const updatedTypes = {
      ...preferences.types,
      [type]: !preferences.types[type],
    };
    setPreferences({ ...preferences, types: updatedTypes });
    await pushNotificationService.updatePreferences(currentUser.id, { types: updatedTypes });
  };

  // =====================================================
  // FILTERED NOTIFICATIONS
  // =====================================================

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // =====================================================
  // RENDER
  // =====================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div
        className="bg-white w-full max-w-md h-full shadow-xl flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-gray-700" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && preferences && (
          <div className="border-b p-4 bg-gray-50 space-y-4">
            <h3 className="font-medium text-gray-900">Notification Settings</h3>

            {/* Master Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Enable notifications</span>
              <button
                onClick={() => handlePreferenceChange('enabled', !preferences.enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.enabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.enabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Channel toggles */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase font-medium">Channels</p>
              {Object.entries(preferences.channels).map(([channel, enabled]) => (
                <div key={channel} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{channel}</span>
                  <button
                    onClick={() =>
                      handlePreferenceChange('channels', {
                        ...preferences.channels,
                        [channel]: !enabled,
                      })
                    }
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      enabled ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        enabled ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Type toggles */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase font-medium">Notification Types</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(preferences.types).map(([type, enabled]) => (
                  <button
                    key={type}
                    onClick={() => handleTypeToggle(type as NotificationType)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      enabled
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {enabled ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                    <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-2 p-3 border-b overflow-x-auto">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="All"
          />
          <FilterButton
            active={filter === 'unread'}
            onClick={() => setFilter('unread')}
            label="Unread"
            count={unreadCount}
          />
          <FilterButton
            active={filter === 'new_message'}
            onClick={() => setFilter('new_message')}
            label="Messages"
          />
          <FilterButton
            active={filter === 'viewing_request'}
            onClick={() => setFilter('viewing_request')}
            label="Viewings"
          />
        </div>

        {/* Actions bar */}
        {unreadCount > 0 && (
          <div className="flex justify-end px-4 py-2 border-b">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 text-gray-300 mb-3" />
              <p>No notifications</p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="text-sm text-blue-600 mt-2"
                >
                  View all
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onMarkAsRead={(e) => handleMarkAsRead(notification.id, e)}
                  onDelete={(e) => handleDelete(notification.id, e)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// FILTER BUTTON
// =====================================================

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  active,
  onClick,
  label,
  count,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
      active
        ? 'bg-blue-100 text-blue-700'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {label}
    {count !== undefined && count > 0 && (
      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </button>
);

// =====================================================
// NOTIFICATION ITEM
// =====================================================

interface NotificationItemProps {
  notification: StoredNotification;
  onClick: () => void;
  onMarkAsRead: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
}) => {
  const timeAgo = formatTimeAgo(notification.createdAt);

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
        !notification.read ? 'bg-blue-50/50' : ''
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm ${
              !notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'
            }`}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
          )}
        </div>
        <p className="text-sm text-gray-500 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-1">
        {!notification.read && (
          <button
            onClick={onMarkAsRead}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Mark as read"
          >
            <Check className="w-4 h-4 text-gray-400" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// =====================================================
// HELPERS
// =====================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  }
  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'Just now';
}

export default NotificationCenter;
