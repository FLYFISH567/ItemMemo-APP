export type ItemStatus = "active" | "idle" | "archived";
export type ReminderType = "high_daily_cost" | "idle_check" | "custom";
export type ReminderStatus = "pending" | "done";

export interface UserProfile {
  id: string;
  nickname: string;
  phone?: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  icon?: string;
  categoryId: string;
  price: number;
  purchaseDate: string;
  status: ItemStatus;
  note: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface Reminder {
  id: string;
  title: string;
  note?: string;
  itemId: string;
  type: ReminderType;
  status: ReminderStatus;
  dueDate: string;
  createdAt: string;
}

export interface AppSettings {
  dailyCostThreshold: number;
  idleThresholdDays: number;
  defaultReminderTime: string;
}

export interface DashboardSummary {
  totalItems: number;
  totalCost: number;
  pendingReminders: number;
  avgDailyCost: number;
  newItemsThisMonth: number;
}

export interface AnalyticsSummary {
  totalItems: number;
  totalCost: number;
  avgDailyCost: number;
  highCostCount: number;
  idleCount: number;
  byCategory: Array<{ name: string; count: number }>;
}

export interface AppDB {
  categories: Category[];
  items: Item[];
  reminders: Reminder[];
  settings: AppSettings;
}
