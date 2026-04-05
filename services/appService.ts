import type {
  AnalyticsSummary,
  AppDB,
  AppSettings,
  Category,
  DashboardSummary,
  Item,
  ItemStatus,
  Reminder,
} from "@/types";
import { dailyCost, daysSince, holdDays } from "@/utils/date";
import { createId } from "@/utils/id";
import { getDb, resetDb, setDb } from "@/storage/localDb";

const EXPORT_COUNT_KEY = "writedown_mobile_export_count";
const DEFAULT_DAILY_COST_THRESHOLD = 5;
const DEFAULT_IDLE_THRESHOLD_DAYS = 60;
const DEFAULT_REMINDER_TIME = "09:00";

export interface ItemQuery {
  keyword?: string;
  categoryId?: string;
  status?: ItemStatus | "all";
  sortBy?: "updatedAt" | "price" | "purchaseDate" | "dailyCost";
  sortOrder?: "asc" | "desc";
}

export function getDashboardSummary(): DashboardSummary {
  const db = getDb();
  const totalItems = db.items.length;
  const totalCost = db.items.reduce((sum, item) => sum + item.price, 0);
  const pendingReminders = db.reminders.filter((r) => r.status === "pending").length;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const newItemsThisMonth = db.items.filter((item) => {
    const created = new Date(item.createdAt);
    if (Number.isNaN(created.getTime())) {
      return false;
    }
    return created.getFullYear() === currentYear && created.getMonth() === currentMonth;
  }).length;
  const avgDailyCost =
    totalItems === 0
      ? 0
      : Number(
          (
            db.items.reduce((sum, item) => sum + dailyCost(item.price, item.purchaseDate), 0) / totalItems
          ).toFixed(2)
        );
  return { totalItems, totalCost, pendingReminders, avgDailyCost, newItemsThisMonth };
}

export function getProfileSummary(): { totalItems: number; totalReminders: number; exportCount: number } {
  const db = getDb();
  return {
    totalItems: db.items.length,
    totalReminders: db.reminders.length,
    exportCount: getExportCount(),
  };
}

export function listItems(query?: ItemQuery): Item[] {
  const db = getDb();
  let data = [...db.items];

  if (query?.keyword) {
    const keyword = query.keyword.toLowerCase();
    const categoryIdsByKeyword = new Set(
      db.categories.filter((category) => category.name.toLowerCase().includes(keyword)).map((category) => category.id)
    );
    data = data.filter((item) => item.name.toLowerCase().includes(keyword) || categoryIdsByKeyword.has(item.categoryId));
  }
  if (query?.categoryId) {
    data = data.filter((item) => item.categoryId === query.categoryId);
  }
  if (query?.status && query.status !== "all") {
    data = data.filter((item) => item.status === query.status);
  }

  const sortBy = query?.sortBy || "updatedAt";
  const sortOrder = query?.sortOrder || "desc";
  const order = sortOrder === "asc" ? 1 : -1;
  data.sort((a, b) => {
    if (sortBy === "price") {
      return (a.price - b.price) * order;
    }
    if (sortBy === "purchaseDate") {
      return (new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()) * order;
    }
    if (sortBy === "dailyCost") {
      return (dailyCost(a.price, a.purchaseDate) - dailyCost(b.price, b.purchaseDate)) * order;
    }
    return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * order;
  });

  return data;
}

export function getItemById(id: string): Item | undefined {
  return getDb().items.find((item) => item.id === id);
}

export function createItem(payload: Omit<Item, "id" | "createdAt" | "updatedAt">): Item {
  const db = getDb();
  const now = new Date().toISOString();
  const item: Item = {
    ...payload,
    id: createId("item"),
    createdAt: now,
    updatedAt: now,
    lastUsedAt: payload.status === "active" ? payload.purchaseDate : payload.lastUsedAt,
  };
  db.items.unshift(item);
  setDb(db);
  syncSystemReminders();
  return item;
}

export function updateItem(id: string, payload: Partial<Omit<Item, "id" | "createdAt">>): Item {
  const db = getDb();
  const index = db.items.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new Error("物品不存在");
  }
  const old = db.items[index];
  const statusChangedToActive = payload.status === "active" && old.status !== "active";
  const merged: Item = {
    ...old,
    ...payload,
    updatedAt: new Date().toISOString(),
    lastUsedAt: statusChangedToActive ? new Date().toISOString().slice(0, 10) : old.lastUsedAt,
  };
  db.items[index] = merged;
  setDb(db);
  syncSystemReminders();
  return merged;
}

export function markItemUsed(id: string): Item {
  return updateItem(id, { lastUsedAt: new Date().toISOString().slice(0, 10), status: "active" });
}

export function deleteItem(id: string): void {
  const db = getDb();
  db.items = db.items.filter((item) => item.id !== id);
  db.reminders = db.reminders.filter((reminder) => reminder.itemId !== id);
  setDb(db);
}

export function listCategories(): Category[] {
  return getDb().categories;
}

export function addCategory(name: string): Category {
  const db = getDb();
  const exists = db.categories.some((cat) => cat.name === name.trim());
  if (exists) {
    throw new Error("分类已存在");
  }
  const category: Category = {
    id: createId("cat"),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  db.categories.push(category);
  setDb(db);
  return category;
}

export function renameCategory(id: string, name: string): Category {
  const db = getDb();
  const category = db.categories.find((cat) => cat.id === id);
  if (!category) {
    throw new Error("分类不存在");
  }
  const nextName = name.trim();
  if (!nextName) {
    throw new Error("分类名称不能为空");
  }
  const duplicated = db.categories.some((cat) => cat.id !== id && cat.name === nextName);
  if (duplicated) {
    throw new Error("分类已存在");
  }
  category.name = nextName;
  setDb(db);
  return category;
}

export function deleteCategory(id: string): void {
  const db = getDb();
  const used = db.items.some((item) => item.categoryId === id);
  if (used) {
    throw new Error("该分类仍有关联物品，请先迁移");
  }
  db.categories = db.categories.filter((cat) => cat.id !== id);
  setDb(db);
}

export function migrateCategory(fromId: string, toId: string): void {
  if (fromId === toId) {
    return;
  }
  const db = getDb();
  const fromExists = db.categories.some((item) => item.id === fromId);
  const toExists = db.categories.some((item) => item.id === toId);
  if (!fromExists || !toExists) {
    throw new Error("分类不存在");
  }
  db.items = db.items.map((item) => (item.categoryId === fromId ? { ...item, categoryId: toId } : item));
  setDb(db);
}

export function listReminders(): Reminder[] {
  return getDb().reminders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createCustomReminder(payload: { title: string; note?: string; dueDate?: string }): Reminder {
  const db = getDb();
  const now = new Date().toISOString();
  const reminder: Reminder = {
    id: createId("rem"),
    title: payload.title.trim(),
    note: (payload.note || "").trim(),
    itemId: "",
    type: "custom",
    status: "pending",
    dueDate: payload.dueDate || new Date().toISOString().slice(0, 10),
    createdAt: now,
  };
  db.reminders.unshift(reminder);
  setDb(db);
  return reminder;
}

export function completeReminder(id: string): void {
  const db = getDb();
  db.reminders = db.reminders.map((item) => (item.id === id ? { ...item, status: "done" } : item));
  setDb(db);
}

export function updateReminder(id: string, payload: { title?: string; note?: string; dueDate?: string; status?: "pending" | "done" }): Reminder {
  const db = getDb();
  const index = db.reminders.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new Error("提醒不存在");
  }
  const current = db.reminders[index];
  const next: Reminder = {
    ...current,
    ...payload,
    title: payload.title !== undefined ? payload.title.trim() : current.title,
    note: payload.note !== undefined ? payload.note.trim() : current.note,
  };
  db.reminders[index] = next;
  setDb(db);
  return next;
}

export function postponeReminder(id: string): void {
  const db = getDb();
  db.reminders = db.reminders.map((item) =>
    item.id === id ? { ...item, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10) } : item
  );
  setDb(db);
}

export function completeAllReminders(): void {
  const db = getDb();
  db.reminders = db.reminders.map((item) => ({ ...item, status: "done" }));
  setDb(db);
}

export function clearAllReminders(): void {
  const db = getDb();
  db.reminders = [];
  setDb(db);
}

export function deleteReminder(id: string): void {
  const db = getDb();
  db.reminders = db.reminders.filter((item) => item.id !== id);
  setDb(db);
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const db = getDb();
  const byCategory = db.categories.map((category) => ({
    name: category.name,
    count: db.items.filter((item) => item.categoryId === category.id).length,
  }));
  const threshold = Number.isFinite(db.settings.dailyCostThreshold) && db.settings.dailyCostThreshold > 0 ? db.settings.dailyCostThreshold : 5;
  const idleThreshold = Number.isFinite(db.settings.idleThresholdDays) && db.settings.idleThresholdDays > 0 ? db.settings.idleThresholdDays : 60;
  const avgDailyCost =
    db.items.length === 0
      ? 0
      : Number((db.items.reduce((sum, item) => sum + dailyCost(item.price, item.purchaseDate), 0) / db.items.length).toFixed(2));
  return {
    totalItems: db.items.length,
    totalCost: db.items.reduce((sum, item) => sum + item.price, 0),
    avgDailyCost,
    highCostCount: db.items.filter((item) => dailyCost(item.price, item.purchaseDate) >= threshold).length,
    idleCount: db.items.filter((item) => {
      if (item.status === "idle") {
        return true;
      }
      const base = item.lastUsedAt || item.updatedAt;
      return daysSince(base) >= idleThreshold;
    }).length,
    byCategory,
  };
}

export function getSettings(): AppSettings {
  return normalizeSettings(getDb().settings);
}

export function updateSettings(payload: Partial<AppSettings>): AppSettings {
  const db = getDb();
  db.settings = normalizeSettings({ ...db.settings, ...payload });
  setDb(db);
  syncSystemReminders();
  return db.settings;
}

export function exportData(): string {
  incrementExportCount();
  const db = getDb();
  return JSON.stringify(db, null, 2);
}

export function resetDemoData(): void {
  resetDb();
  uni.setStorageSync(EXPORT_COUNT_KEY, 0);
}

export function importDataFromJson(jsonText: string): { categories: number; items: number; reminders: number } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("JSON 格式无效");
  }

  if (!isValidAppDb(parsed)) {
    throw new Error("JSON 数据结构不正确");
  }

  const normalized = normalizeImportedDb(parsed);
  setDb(normalized);
  return {
    categories: normalized.categories.length,
    items: normalized.items.length,
    reminders: normalized.reminders.length,
  };
}

function getExportCount(): number {
  const raw = uni.getStorageSync(EXPORT_COUNT_KEY);
  const num = Number(raw);
  return Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0;
}

function incrementExportCount(): void {
  const next = getExportCount() + 1;
  uni.setStorageSync(EXPORT_COUNT_KEY, next);
}

function isValidAppDb(data: unknown): data is AppDB {
  if (!isRecord(data)) {
    return false;
  }
  const db = data;
  if (!Array.isArray(db.categories) || !Array.isArray(db.items) || !Array.isArray(db.reminders)) {
    return false;
  }
  if (!isRecord(db.settings)) {
    return false;
  }

  return (
    db.categories.every((item) => isValidCategory(item)) &&
    db.items.every((item) => isValidItem(item)) &&
    db.reminders.every((item) => isValidReminder(item)) &&
    isValidSettings(db.settings)
  );
}

function syncSystemReminders(): void {
  const db = getDb();
  const settings = normalizeSettings(db.settings);
  db.settings = settings;
  const custom = db.reminders.filter((reminder) => reminder.type === "custom");
  const generated: Reminder[] = [];

  db.items.forEach((item) => {
    const daily = dailyCost(item.price, item.purchaseDate);
    if (daily >= settings.dailyCostThreshold) {
      generated.push({
        id: createId("rem"),
        title: `"${item.name}" 日均成本偏高（${daily}/天）`,
        itemId: item.id,
        type: "high_daily_cost",
        status: "pending",
        dueDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      });
    }

    const base = item.lastUsedAt || item.updatedAt;
    if (daysSince(base) >= settings.idleThresholdDays) {
      generated.push({
        id: createId("rem"),
        title: `"${item.name}" 已闲置 ${daysSince(base)} 天`,
        itemId: item.id,
        type: "idle_check",
        status: "pending",
        dueDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      });
    }
  });

  const unique = new Map<string, Reminder>();
  [...custom, ...generated].forEach((r) => {
    const key = `${r.itemId}_${r.type}_${r.title}`;
    if (!unique.has(key)) {
      unique.set(key, r);
    }
  });
  db.reminders = Array.from(unique.values());
  setDb(db);
}

export function getItemExtra(item: Item): { holdDays: number; dailyCost: number } {
  return {
    holdDays: holdDays(item.purchaseDate),
    dailyCost: dailyCost(item.price, item.purchaseDate),
  };
}

function normalizeImportedDb(db: AppDB): AppDB {
  return {
    categories: db.categories.map((item) => ({
      id: item.id,
      name: item.name.trim(),
      createdAt: item.createdAt,
    })),
    items: db.items.map((item) => ({
      ...item,
      name: item.name.trim(),
      note: item.note.trim(),
      icon: (item.icon || "").trim() || undefined,
      price: Number(item.price),
    })),
    reminders: db.reminders.map((item) => ({
      ...item,
      title: item.title.trim(),
      note: item.note?.trim(),
    })),
    settings: normalizeSettings(db.settings),
  };
}

function normalizeSettings(settings: Partial<AppSettings>): AppSettings {
  return {
    dailyCostThreshold: sanitizeFiniteNumber(settings.dailyCostThreshold, DEFAULT_DAILY_COST_THRESHOLD, 0.01),
    idleThresholdDays: Math.round(sanitizeFiniteNumber(settings.idleThresholdDays, DEFAULT_IDLE_THRESHOLD_DAYS, 1)),
    defaultReminderTime: sanitizeReminderTime(settings.defaultReminderTime),
  };
}

function sanitizeFiniteNumber(value: unknown, fallback: number, min: number): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return Math.max(min, num);
}

function sanitizeReminderTime(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_REMINDER_TIME;
  }
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value) ? value : DEFAULT_REMINDER_TIME;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isItemStatus(value: unknown): value is ItemStatus {
  return value === "active" || value === "idle" || value === "archived";
}

function isReminderType(value: unknown): value is Reminder["type"] {
  return value === "high_daily_cost" || value === "idle_check" || value === "custom";
}

function isReminderStatus(value: unknown): value is Reminder["status"] {
  return value === "pending" || value === "done";
}

function isValidCategory(data: unknown): data is Category {
  if (!isRecord(data)) {
    return false;
  }
  return isNonEmptyString(data.id) && isNonEmptyString(data.name) && isNonEmptyString(data.createdAt);
}

function isValidItem(data: unknown): data is Item {
  if (!isRecord(data)) {
    return false;
  }
  if (
    !isNonEmptyString(data.id) ||
    !isNonEmptyString(data.name) ||
    !isNonEmptyString(data.categoryId) ||
    !Number.isFinite(data.price) ||
    !isNonEmptyString(data.purchaseDate) ||
    !isItemStatus(data.status) ||
    typeof data.note !== "string" ||
    !isNonEmptyString(data.createdAt) ||
    !isNonEmptyString(data.updatedAt)
  ) {
    return false;
  }
  return isOptionalString(data.lastUsedAt) && isOptionalString(data.icon);
}

function isValidReminder(data: unknown): data is Reminder {
  if (!isRecord(data)) {
    return false;
  }
  return (
    isNonEmptyString(data.id) &&
    isNonEmptyString(data.title) &&
    isOptionalString(data.note) &&
    typeof data.itemId === "string" &&
    isReminderType(data.type) &&
    isReminderStatus(data.status) &&
    isNonEmptyString(data.dueDate) &&
    isNonEmptyString(data.createdAt)
  );
}

function isValidSettings(data: unknown): data is AppSettings {
  if (!isRecord(data)) {
    return false;
  }
  return (
    Number.isFinite(data.dailyCostThreshold) &&
    Number.isFinite(data.idleThresholdDays) &&
    typeof data.defaultReminderTime === "string"
  );
}
