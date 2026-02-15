import { supabase } from '@/integrations/supabase/client';

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// Show a local notification (used as fallback when push isn't available)
export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (getNotificationPermission() !== 'granted') return;
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options,
      });
    });
  } else {
    new Notification(title, {
      icon: '/icon-192.png',
      ...options,
    });
  }
}

// Subscribe to push notifications and save subscription to database
export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    const pushManager = (registration as any).pushManager;
    if (!pushManager) return false;
    
    const existingSub = await pushManager.getSubscription();
    if (existingSub) {
      await savePushSubscription(userId, existingSub);
      return true;
    }

    // Note: In production, you'd use VAPID keys here
    // For now, we rely on local notifications via the realtime subscription
    return true;
  } catch (error) {
    console.error('Push subscription error:', error);
    return false;
  }
}

async function savePushSubscription(userId: string, subscription: PushSubscription) {
  const key = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');
  
  if (!key || !auth) return;

  await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
    }, { onConflict: 'user_id,endpoint' });
}
