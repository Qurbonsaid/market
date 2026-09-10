import { getToken, isSupported, onMessage } from "firebase/messaging";
import { getMessaging } from "firebase/messaging";
import { getFirebaseApp } from "./firebase";
import { saveNotificationToken } from "./firestoreService";
import type { InventoryProduct } from "../types";

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY as string | undefined;
const LOW_STOCK_NOTICE_KEY = "market_erp_low_stock_notice";
const BALANCE_NOTICE_KEY = "market_erp_paynet_balance_notice";

function showBrowserNotification(
  title: string,
  body: string,
  tag: string,
): void {
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  )
    return;
  new Notification(title, { body, tag, icon: "/favicon.svg" });
}

function canShowBrowserNotification(): boolean {
  return (
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
}

export async function setupPushNotifications(
  userId: string,
  onForegroundMessage?: (title: string, body: string) => void,
): Promise<() => void> {
  if (!VAPID_KEY || !("Notification" in window) || !(await isSupported()))
    return () => undefined;
  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return () => undefined;

  const registration = await navigator.serviceWorker.ready;
  const messaging = getMessaging(getFirebaseApp());
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (token) await saveNotificationToken(userId, token);

  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title || "Market ERP";
    const body = payload.notification?.body || "Yangi bildirishnoma";
    onForegroundMessage?.(title, body);
    showBrowserNotification(title, body, "market-erp-fcm");
  });
}

export function notifyLowStockProducts(products: InventoryProduct[]): void {
  if (!canShowBrowserNotification()) return;
  const lowStock = products.filter(
    (product) => product.quantity < product.minStockAlert,
  );
  if (lowStock.length === 0) return;
  const signature = lowStock
    .map((product) => `${product.id}:${product.quantity}`)
    .sort()
    .join("|");
  if (localStorage.getItem(LOW_STOCK_NOTICE_KEY) === signature) return;
  localStorage.setItem(LOW_STOCK_NOTICE_KEY, signature);
  const names = lowStock
    .slice(0, 3)
    .map((product) => product.name)
    .join(", ");
  const suffix =
    lowStock.length > 3 ? ` va yana ${lowStock.length - 3} ta` : "";
  showBrowserNotification(
    "Ombor ogohlantirishi",
    `${names}${suffix} mahsulotining qoldig'i belgilangan limitdan past.`,
    "market-erp-low-stock",
  );
}

export function notifyPaynetBalance(balance: number, alertLimit: number): void {
  if (!canShowBrowserNotification()) return;
  if (alertLimit <= 0 || balance > alertLimit) return;
  const signature = `${balance}:${alertLimit}`;
  if (localStorage.getItem(BALANCE_NOTICE_KEY) === signature) return;
  localStorage.setItem(BALANCE_NOTICE_KEY, signature);
  showBrowserNotification(
    "Paynet balansi past",
    `Digital balans ${balance.toLocaleString("uz-UZ")} so'm.`,
    "market-erp-paynet-balance",
  );
}
