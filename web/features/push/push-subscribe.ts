/** Web Push 订阅逻辑 - Service Worker 注册 + 订阅/取消。 */

import { apiFetch } from "@/lib/api";

// VAPID 公钥（公开，可硬编码前端）
const VAPID_PUBLIC_KEY =
  "BGDz6nB4_iJLd8ZnJMgHaqcUmLiXCEjk5GZkI2di8nQ13wWsTAsf__aotDuk0p9jjxvX4L0HfRcdBZHreqV72fI";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Str = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64Str);
  const array = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    array[i] = rawData.charCodeAt(i);
  }
  return array;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function registerServiceWorker(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch (e) {
    // Service Worker 注册失败不阻断（降级为应用内消息）
    console.warn("SW 注册失败:", e);
  }
}

export async function subscribePush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    await submitSubscription(existing);
    return true;
  }

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await submitSubscription(subscription);
  return true;
}

async function submitSubscription(subscription: PushSubscription): Promise<void> {
  const subJson = subscription.toJSON();
  await apiFetch("/push/subscribe", {
    method: "POST",
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: subJson.keys,
    }),
  });
}

export async function unsubscribePush(): Promise<void> {
  await apiFetch("/push/subscribe", { method: "DELETE" });
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await sub.unsubscribe();
  }
}
