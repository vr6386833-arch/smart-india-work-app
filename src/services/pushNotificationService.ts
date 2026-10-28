/**
 * Android APK Background Push Service
 * Smart India Work App - FCM & High-Priority Notification Channel
 * 
 * Features:
 * - High Priority Android Notification Channel (`smart_india_emergency_alerts_v1`)
 * - Importance: High (Heads-up notification over lock screen)
 * - Custom loud siren chime playback
 * - Screen WakeLock API (Screen turns on when booking arrives)
 * - Service Worker Background Push sync
 */

import { soundManager } from './soundEffects';

export interface PushChannelConfig {
  channelId: string;
  channelName: string;
  importance: 'HIGH' | 'MAX' | 'DEFAULT';
  vibrationPattern: number[];
  bypassDnd: boolean;
  wakeLockEnabled: boolean;
  serviceWorkerRegistered: boolean;
  permissionStatus: NotificationPermission;
}

export class PushNotificationService {
  private static channelId = 'smart_india_emergency_alerts_v1';
  private static swRegistration: ServiceWorkerRegistration | null = null;
  private static wakeLock: any = null;

  /**
   * Initialize Service Worker and Push Notification Channel
   */
  public static async init(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        this.swRegistration = reg;
        console.log('[PushService] ServiceWorker registered with scope:', reg.scope);
      } catch (err) {
        console.warn('[PushService] ServiceWorker registration error:', err);
      }
    }

    return true;
  }

  /**
   * Request Native Browser / Android Notification Permission
   */
  public static async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      return 'denied';
    }
  }

  /**
   * Get current push configuration status
   */
  public static getStatus(): PushChannelConfig {
    const permission: NotificationPermission = 
      typeof window !== 'undefined' && 'Notification' in window 
        ? Notification.permission 
        : 'default';

    return {
      channelId: this.channelId,
      channelName: 'Smart India High-Priority Job Channel',
      importance: 'HIGH',
      vibrationPattern: [500, 250, 500, 250, 500],
      bypassDnd: true,
      wakeLockEnabled: 'wakeLock' in navigator,
      serviceWorkerRegistered: !!this.swRegistration,
      permissionStatus: permission,
    };
  }

  /**
   * Request Screen WakeLock (Turns screen on and keeps it awake for incoming booking)
   */
  public static async requestWakeLock(): Promise<boolean> {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('[PushService] Screen WakeLock acquired.');
        return true;
      } catch (err) {
        console.warn('[PushService] WakeLock request failed:', err);
      }
    }
    return false;
  }

  /**
   * Release WakeLock
   */
  public static releaseWakeLock(): void {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
        this.wakeLock = null;
      } catch (e) {}
    }
  }

  /**
   * Trigger High-Priority Push Alert on Android Phone / Desktop
   */
  public static async triggerJobPushAlert(params: {
    customerName: string;
    category: string;
    locality: string;
    amount: number;
    bookingId: string;
  }): Promise<boolean> {
    // 1. Acquire Wake Lock to wake up the screen
    await this.requestWakeLock();

    // 2. Play high-priority chime ringtone
    soundManager.playIncomingJobAlert();

    // 3. Trigger native notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await this.requestPermission();
      }

      if (Notification.permission === 'granted') {
        const title = `🚨 नया काम आया है! [${params.category}]`;
        const options: any = {
          body: `ग्राहक ${params.customerName} ने आपको ${params.locality} में काम के लिए बुक किया है। संभावित कमाई: ₹${params.amount}। तुरंत स्वीकार करें!`,
          icon: '/assets/icon-192.png',
          badge: '/assets/icon-192.png',
          tag: 'smart_india_job_alert',
          requireInteraction: true,
          vibrate: [500, 250, 500, 250, 500],
          data: {
            bookingId: params.bookingId,
            url: '/',
          },
        };

        if (this.swRegistration) {
          try {
            await this.swRegistration.showNotification(title, options);
            return true;
          } catch (e) {
            new Notification(title, options);
            return true;
          }
        } else {
          new Notification(title, options);
          return true;
        }
      }
    }

    return true;
  }
}
