import type { AppDB, AppSettings, Category, Item, Reminder } from "@/types";
import { createId } from "@/utils/id";
import { formatDate } from "@/utils/date";

const DB_KEY = "writedown_mobile_db";

const defaultSettings: AppSettings = {
  dailyCostThreshold: 5,
  idleThresholdDays: 60,
  defaultReminderTime: "09:00",
};

function seedCategories(): Category[] {
  const now = new Date().toISOString();
  return [
    { id: createId("cat"), name: "数码", createdAt: now },
    { id: createId("cat"), name: "家居", createdAt: now },
    { id: createId("cat"), name: "消耗品", createdAt: now },
  ];
}

function seedItems(categories: Category[]): Item[] {
  const now = new Date().toISOString();
  const digital = categories[0]?.id || "";
  const home = categories[1]?.id || "";
  return [
    {
      id: createId("item"),
      name: "机械键盘",
      icon: "⌨️",
      categoryId: digital,
      price: 699,
      purchaseDate: formatDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 45)),
      status: "active",
      note: "办公常用",
      createdAt: now,
      updatedAt: now,
      lastUsedAt: formatDate(new Date()),
    },
    {
      id: createId("item"),
      name: "咖啡机",
      icon: "☕",
      categoryId: home,
      price: 1299,
      purchaseDate: formatDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 140)),
      status: "idle",
      note: "近期使用较少",
      createdAt: now,
      updatedAt: now,
      lastUsedAt: formatDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 70)),
    },
  ];
}

function seedReminders(items: Item[]): Reminder[] {
  const now = new Date().toISOString();
  const target = items[1];
  if (!target) {
    return [];
  }
  return [
    {
      id: createId("rem"),
      title: "该物品已长期闲置，请评估是否继续保留",
      itemId: target.id,
      type: "idle_check",
      status: "pending",
      dueDate: formatDate(new Date()),
      createdAt: now,
    },
  ];
}

function defaultDb(): AppDB {
  const categories = seedCategories();
  const items = seedItems(categories);
  return {
    categories,
    items,
    reminders: seedReminders(items),
    settings: defaultSettings,
  };
}

export function getDb(): AppDB {
  const raw = uni.getStorageSync(DB_KEY);
  if (!raw) {
    const db = defaultDb();
    setDb(db);
    return db;
  }
  try {
    return JSON.parse(raw) as AppDB;
  } catch {
    const db = defaultDb();
    setDb(db);
    return db;
  }
}

export function setDb(db: AppDB): void {
  uni.setStorageSync(DB_KEY, JSON.stringify(db));
}

export function resetDb(): AppDB {
  const db = defaultDb();
  setDb(db);
  return db;
}
