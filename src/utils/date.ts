export function formatDate(date: string | number | Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function holdDays(purchaseDate: string): number {
  const start = new Date(formatDate(purchaseDate)).getTime();
  const now = new Date(formatDate(new Date())).getTime();
  const diff = Math.max(0, now - start);
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function dailyCost(price: number, purchaseDate: string): number {
  const days = holdDays(purchaseDate);
  return Number((price / Math.max(1, days)).toFixed(2));
}

export function daysSince(date: string): number {
  const target = new Date(formatDate(date)).getTime();
  const now = new Date(formatDate(new Date())).getTime();
  const diff = Math.max(0, now - target);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
