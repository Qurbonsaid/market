export function formatPrice(price: number, currency = "so'm"): string {
  if (isNaN(price)) return `0 ${currency}`;
  const formatted = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} ${currency}`;
}

export function formatDate(timestamp: number): string {
  if (!timestamp) return "";
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Hozirgina";
  if (diffMinutes < 60) return `${diffMinutes} daqiqa oldin`;
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    const hours = date.getHours().toString().padStart(2, "0");
    const mins = date.getMinutes().toString().padStart(2, "0");
    return `Bugun, ${hours}:${mins}`;
  }
  if (diffDays === 1) {
    const hours = date.getHours().toString().padStart(2, "0");
    const mins = date.getMinutes().toString().padStart(2, "0");
    return `Kecha, ${hours}:${mins}`;
  }

  const monthsUz = [
    "yanvar", "fevral", "mart", "aprel", "may", "iyun",
    "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"
  ];
  return `${date.getDate()}-${monthsUz[date.getMonth()]}, ${date.getFullYear()}`;
}

export function cleanPhoneNumber(phone: string): string {
  // Remove non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+") && cleaned.startsWith("998")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+998") && cleaned.length === 9) {
    cleaned = "+998" + cleaned;
  }
  return cleaned;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("998")) {
    return `+${cleaned.slice(0, 3)} (${cleaned.slice(3, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10, 12)}`;
  }
  return phone;
}

export function getTelegramLink(username: string): string {
  if (!username) return "";
  const clean = username.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "").trim();
  return `https://t.me/${clean}`;
}
