const TERMINAL_PIN_PREFIX = "market_terminal_pin_";
const TERMINAL_LOCK_KEY = "market_terminal_locked";

function storageKey(uid: string): string {
  return `${TERMINAL_PIN_PREFIX}${uid}`;
}

export function normalizeTerminalPin(pin: string): string {
  return pin.replace(/\D/g, "").slice(0, 4);
}

export async function hashTerminalPin(pin: string): Promise<string> {
  const normalized = normalizeTerminalPin(pin);
  if (!/^\d{4}$/.test(normalized)) {
    throw new Error(
      "Terminal PIN-kodi aynan 4 raqamdan iborat bo'lishi kerak.",
    );
  }

  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function hasTerminalPin(uid: string): boolean {
  return Boolean(localStorage.getItem(storageKey(uid)));
}

export async function setTerminalPin(uid: string, pin: string): Promise<void> {
  localStorage.setItem(storageKey(uid), await hashTerminalPin(pin));
}

export async function verifyTerminalPin(
  uid: string,
  pin: string,
): Promise<boolean> {
  const storedHash = localStorage.getItem(storageKey(uid));
  if (!storedHash) return false;
  return storedHash === (await hashTerminalPin(pin));
}

export function clearTerminalPin(uid: string): void {
  localStorage.removeItem(storageKey(uid));
}

export function isTerminalLocked(): boolean {
  return localStorage.getItem(TERMINAL_LOCK_KEY) === "true";
}

export function setTerminalLocked(locked: boolean): void {
  if (locked) localStorage.setItem(TERMINAL_LOCK_KEY, "true");
  else localStorage.removeItem(TERMINAL_LOCK_KEY);
}
