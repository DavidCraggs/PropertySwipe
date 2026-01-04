/**
 * Push Notification Service
 *
 * Handles Web Push API integration for real-time notifications.
 * Supports service worker registration and notification management.
 */

import { supabase } from '../lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export type NotificationType =
  | 'new_match'
  | 'new_message'
  | 'viewing_request'
  | 'viewing_confirmed'
  | 'viewing_reminder'
  | 'document_request'
  | 'document_received'
  | 'payment_due'
  | 'payment_received'
  | 'maintenance_update'
  | 'verification_complete'
  | 'system';

export interface StoredNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  enabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  types: Record<NotificationType, boolean>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
}

// =====================================================
// DEFAULT PREFERENCES
// =====================================================

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  channels: {
    push: true,
    email: true,
    sms: false,
  },
  types: {
    new_match: true,
    new_message: true,
    viewing_request: true,
    viewing_confirmed: true,
    viewing_reminder: true,
    document_request: true,
    document_received: true,
    payment_due: true,
    payment_received: true,
    maintenance_update: true,
    verification_complete: true,
    system: true,
  },
};

// =====================================================
// SERVICE IMPLEMENTATION
// =====================================================

export class PushNotificationService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || null;
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================

  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register(
        '/sw.js',
        { scope: '/' }
      );

      console.log('Service worker registered');
      return true;
    } catch (err) {
      console.error('Failed to register service worker:', err);
      return false;
    }
  }

  // =====================================================
  // PERMISSION MANAGEMENT
  // =====================================================

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) {
      return 'denied';
    }
    return Notification.permission;
  }

  // =====================================================
  // SUBSCRIPTION MANAGEMENT
  // =====================================================

  async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!this.isSupported || !this.serviceWorkerRegistration) {
      return null;
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    try {
      // Get existing subscription or create new one
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();

      if (!subscription && this.vapidPublicKey) {
        subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
        });
      }

      if (subscription) {
        // Store subscription in database
        await this.saveSubscription(userId, subscription);
      }

      return subscription;
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
      return null;
    }
  }

  async unsubscribe(userId: string): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscription(userId);
      }

      return true;
    } catch (err) {
      console.error('Failed to unsubscribe from push notifications:', err);
      return false;
    }
  }

  private async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    const subscriptionData = subscription.toJSON();

    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: subscriptionData.endpoint,
      keys: subscriptionData.keys,
      created_at: new Date().toISOString(),
    });
  }

  private async removeSubscription(userId: string): Promise<void> {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);
  }

  // =====================================================
  // LOCAL NOTIFICATIONS
  // =====================================================

  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      return;
    }

    if (this.serviceWorkerRegistration) {
      // Use type assertion for service worker notification options
      const options: NotificationOptions & { actions?: NotificationAction[]; requireInteraction?: boolean } = {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192.png',
        badge: payload.badge || '/icons/badge-72.png',
        tag: payload.tag,
        data: payload.data,
        silent: payload.silent,
      };
      if (payload.actions) {
        options.actions = payload.actions;
      }
      if (payload.requireInteraction) {
        options.requireInteraction = payload.requireInteraction;
      }
      await this.serviceWorkerRegistration.showNotification(payload.title, options);
    } else {
      // Fallback to regular notification
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192.png',
        tag: payload.tag,
        data: payload.data,
        silent: payload.silent,
      });
    }
  }

  // =====================================================
  // NOTIFICATION TEMPLATES
  // =====================================================

  getNotificationPayload(
    type: NotificationType,
    data: Record<string, unknown>
  ): NotificationPayload {
    switch (type) {
      case 'new_match':
        return {
          title: '🎉 New Match!',
          body: `You matched with ${data.propertyTitle || 'a new property'}!`,
          tag: `match-${data.matchId}`,
          data: { type, matchId: data.matchId },
          actions: [
            { action: 'view', title: 'View Match' },
            { action: 'dismiss', title: 'Dismiss' },
          ],
        };

      case 'new_message':
        return {
          title: `💬 ${data.senderName || 'New message'}`,
          body: (data.preview as string) || 'You have a new message',
          tag: `message-${data.matchId}`,
          data: { type, matchId: data.matchId },
          actions: [
            { action: 'reply', title: 'Reply' },
            { action: 'dismiss', title: 'Dismiss' },
          ],
        };

      case 'viewing_request':
        return {
          title: '📅 Viewing Request',
          body: `${data.renterName || 'Someone'} requested a viewing for ${data.propertyTitle || 'your property'}`,
          tag: `viewing-${data.viewingId}`,
          data: { type, viewingId: data.viewingId },
          requireInteraction: true,
          actions: [
            { action: 'accept', title: 'Accept' },
            { action: 'decline', title: 'Decline' },
          ],
        };

      case 'viewing_confirmed':
        return {
          title: '✅ Viewing Confirmed',
          body: `Your viewing at ${data.propertyTitle || 'the property'} is confirmed for ${data.date || 'soon'}`,
          tag: `viewing-confirmed-${data.viewingId}`,
          data: { type, viewingId: data.viewingId },
        };

      case 'viewing_reminder':
        return {
          title: '⏰ Viewing Reminder',
          body: `Your viewing is in ${data.timeUntil || '1 hour'} at ${data.propertyTitle || 'the property'}`,
          tag: `viewing-reminder-${data.viewingId}`,
          data: { type, viewingId: data.viewingId },
        };

      case 'document_request':
        return {
          title: '📄 Document Requested',
          body: `${data.requesterName || 'Someone'} requested ${data.documentType || 'a document'}`,
          tag: `doc-request-${data.requestId}`,
          data: { type, requestId: data.requestId },
          requireInteraction: true,
        };

      case 'document_received':
        return {
          title: '📥 Document Received',
          body: `${data.documentType || 'A document'} has been uploaded by ${data.uploaderName || 'someone'}`,
          tag: `doc-received-${data.documentId}`,
          data: { type, documentId: data.documentId },
        };

      case 'payment_due':
        return {
          title: '💷 Payment Due',
          body: `Your rent of £${data.amount || '0'} is due on ${data.dueDate || 'soon'}`,
          tag: `payment-due-${data.paymentId}`,
          data: { type, paymentId: data.paymentId },
          requireInteraction: true,
        };

      case 'payment_received':
        return {
          title: '✅ Payment Received',
          body: `Payment of £${data.amount || '0'} received from ${data.payerName || 'tenant'}`,
          tag: `payment-received-${data.paymentId}`,
          data: { type, paymentId: data.paymentId },
        };

      case 'maintenance_update':
        return {
          title: '🔧 Maintenance Update',
          body: `${data.issueTitle || 'Issue'}: ${data.status || 'Updated'}`,
          tag: `maintenance-${data.issueId}`,
          data: { type, issueId: data.issueId },
        };

      case 'verification_complete':
        return {
          title: '✅ Verification Complete',
          body: `Your ${data.verificationType || 'identity'} verification is complete`,
          tag: `verification-${data.verificationId}`,
          data: { type, verificationId: data.verificationId },
        };

      case 'system':
      default:
        return {
          title: data.title as string || 'PropertySwipe',
          body: data.message as string || 'You have a notification',
          tag: `system-${Date.now()}`,
          data: { type },
        };
    }
  }

  // =====================================================
  // STORED NOTIFICATIONS
  // =====================================================

  async getNotifications(userId: string, limit = 50): Promise<StoredNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }

    return (data || []).map((n) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      read: n.read,
      createdAt: new Date(n.created_at),
      expiresAt: n.expires_at ? new Date(n.expires_at) : undefined,
    }));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }

    return count || 0;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
  }

  // =====================================================
  // PREFERENCES
  // =====================================================

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return DEFAULT_PREFERENCES;
    }

    return {
      enabled: data.enabled,
      channels: data.channels,
      types: data.types,
      quietHours: data.quiet_hours,
    };
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    await supabase.from('notification_preferences').upsert({
      user_id: userId,
      ...preferences,
      quiet_hours: preferences.quietHours,
      updated_at: new Date().toISOString(),
    });
  }

  // =====================================================
  // QUIET HOURS CHECK
  // =====================================================

  isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = preferences.quietHours;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }

    return currentTime >= start && currentTime < end;
  }

  // =====================================================
  // HELPERS
  // =====================================================

  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray.buffer;
  }

  getBrowserSupport(): { supported: boolean; reason?: string } {
    if (!('Notification' in window)) {
      return { supported: false, reason: 'Notifications API not supported' };
    }
    if (!('serviceWorker' in navigator)) {
      return { supported: false, reason: 'Service Workers not supported' };
    }
    if (!('PushManager' in window)) {
      return { supported: false, reason: 'Push API not supported' };
    }
    return { supported: true };
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
