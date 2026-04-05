if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const ON_SHOW = "onShow";
  const ON_LOAD = "onLoad";
  const createLifeCycleHook = (lifecycle, flag = 0) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createLifeCycleHook(
    ON_SHOW,
    1 | 2
    /* HookFlags.PAGE */
  );
  const onLoad = /* @__PURE__ */ createLifeCycleHook(
    ON_LOAD,
    2
    /* HookFlags.PAGE */
  );
  function formatDate(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function holdDays(purchaseDate) {
    const start = new Date(formatDate(purchaseDate)).getTime();
    const now = new Date(formatDate(/* @__PURE__ */ new Date())).getTime();
    const diff = Math.max(0, now - start);
    return Math.floor(diff / (1e3 * 60 * 60 * 24)) + 1;
  }
  function dailyCost(price, purchaseDate) {
    const days = holdDays(purchaseDate);
    return Number((price / Math.max(1, days)).toFixed(2));
  }
  function daysSince(date) {
    const target = new Date(formatDate(date)).getTime();
    const now = new Date(formatDate(/* @__PURE__ */ new Date())).getTime();
    const diff = Math.max(0, now - target);
    return Math.floor(diff / (1e3 * 60 * 60 * 24));
  }
  function createId(prefix) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e5)}`;
  }
  const DB_KEY = "writedown_mobile_db";
  const defaultSettings = {
    dailyCostThreshold: 5,
    idleThresholdDays: 60,
    defaultReminderTime: "09:00"
  };
  function seedCategories() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return [
      { id: createId("cat"), name: "数码", createdAt: now },
      { id: createId("cat"), name: "家居", createdAt: now },
      { id: createId("cat"), name: "消耗品", createdAt: now }
    ];
  }
  function seedItems(categories) {
    var _a, _b;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const digital = ((_a = categories[0]) == null ? void 0 : _a.id) || "";
    const home = ((_b = categories[1]) == null ? void 0 : _b.id) || "";
    return [
      {
        id: createId("item"),
        name: "机械键盘",
        icon: "⌨️",
        categoryId: digital,
        price: 699,
        purchaseDate: formatDate(new Date(Date.now() - 1e3 * 60 * 60 * 24 * 45)),
        status: "active",
        note: "办公常用",
        createdAt: now,
        updatedAt: now,
        lastUsedAt: formatDate(/* @__PURE__ */ new Date())
      },
      {
        id: createId("item"),
        name: "咖啡机",
        icon: "☕",
        categoryId: home,
        price: 1299,
        purchaseDate: formatDate(new Date(Date.now() - 1e3 * 60 * 60 * 24 * 140)),
        status: "idle",
        note: "近期使用较少",
        createdAt: now,
        updatedAt: now,
        lastUsedAt: formatDate(new Date(Date.now() - 1e3 * 60 * 60 * 24 * 70))
      }
    ];
  }
  function seedReminders(items) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
        dueDate: formatDate(/* @__PURE__ */ new Date()),
        createdAt: now
      }
    ];
  }
  function defaultDb() {
    const categories = seedCategories();
    const items = seedItems(categories);
    return {
      categories,
      items,
      reminders: seedReminders(items),
      settings: defaultSettings
    };
  }
  function getDb() {
    const raw = uni.getStorageSync(DB_KEY);
    if (!raw) {
      const db = defaultDb();
      setDb(db);
      return db;
    }
    try {
      return JSON.parse(raw);
    } catch {
      const db = defaultDb();
      setDb(db);
      return db;
    }
  }
  function setDb(db) {
    uni.setStorageSync(DB_KEY, JSON.stringify(db));
  }
  function resetDb() {
    const db = defaultDb();
    setDb(db);
    return db;
  }
  const EXPORT_COUNT_KEY = "writedown_mobile_export_count";
  const DEFAULT_DAILY_COST_THRESHOLD = 5;
  const DEFAULT_IDLE_THRESHOLD_DAYS = 60;
  const DEFAULT_REMINDER_TIME = "09:00";
  function getDashboardSummary() {
    const db = getDb();
    const totalItems = db.items.length;
    const totalCost = db.items.reduce((sum, item) => sum + item.price, 0);
    const pendingReminders = db.reminders.filter((r) => r.status === "pending").length;
    const now = /* @__PURE__ */ new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const newItemsThisMonth = db.items.filter((item) => {
      const created = new Date(item.createdAt);
      if (Number.isNaN(created.getTime())) {
        return false;
      }
      return created.getFullYear() === currentYear && created.getMonth() === currentMonth;
    }).length;
    const avgDailyCost = totalItems === 0 ? 0 : Number(
      (db.items.reduce((sum, item) => sum + dailyCost(item.price, item.purchaseDate), 0) / totalItems).toFixed(2)
    );
    return { totalItems, totalCost, pendingReminders, avgDailyCost, newItemsThisMonth };
  }
  function getProfileSummary() {
    const db = getDb();
    return {
      totalItems: db.items.length,
      totalReminders: db.reminders.length,
      exportCount: getExportCount()
    };
  }
  function listItems(query) {
    const db = getDb();
    let data = [...db.items];
    if (query == null ? void 0 : query.keyword) {
      const keyword = query.keyword.toLowerCase();
      const categoryIdsByKeyword = new Set(
        db.categories.filter((category) => category.name.toLowerCase().includes(keyword)).map((category) => category.id)
      );
      data = data.filter((item) => item.name.toLowerCase().includes(keyword) || categoryIdsByKeyword.has(item.categoryId));
    }
    if (query == null ? void 0 : query.categoryId) {
      data = data.filter((item) => item.categoryId === query.categoryId);
    }
    if ((query == null ? void 0 : query.status) && query.status !== "all") {
      data = data.filter((item) => item.status === query.status);
    }
    const sortBy = (query == null ? void 0 : query.sortBy) || "updatedAt";
    const sortOrder = (query == null ? void 0 : query.sortOrder) || "desc";
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
  function getItemById(id) {
    return getDb().items.find((item) => item.id === id);
  }
  function createItem(payload) {
    const db = getDb();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const item = {
      ...payload,
      id: createId("item"),
      createdAt: now,
      updatedAt: now,
      lastUsedAt: payload.status === "active" ? payload.purchaseDate : payload.lastUsedAt
    };
    db.items.unshift(item);
    setDb(db);
    syncSystemReminders();
    return item;
  }
  function updateItem(id, payload) {
    const db = getDb();
    const index = db.items.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error("物品不存在");
    }
    const old = db.items[index];
    const statusChangedToActive = payload.status === "active" && old.status !== "active";
    const merged = {
      ...old,
      ...payload,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastUsedAt: statusChangedToActive ? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) : old.lastUsedAt
    };
    db.items[index] = merged;
    setDb(db);
    syncSystemReminders();
    return merged;
  }
  function markItemUsed(id) {
    return updateItem(id, { lastUsedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), status: "active" });
  }
  function deleteItem(id) {
    const db = getDb();
    db.items = db.items.filter((item) => item.id !== id);
    db.reminders = db.reminders.filter((reminder) => reminder.itemId !== id);
    setDb(db);
  }
  function listCategories() {
    return getDb().categories;
  }
  function addCategory(name) {
    const db = getDb();
    const exists = db.categories.some((cat) => cat.name === name.trim());
    if (exists) {
      throw new Error("分类已存在");
    }
    const category = {
      id: createId("cat"),
      name: name.trim(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.categories.push(category);
    setDb(db);
    return category;
  }
  function renameCategory(id, name) {
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
  function deleteCategory(id) {
    const db = getDb();
    const used = db.items.some((item) => item.categoryId === id);
    if (used) {
      throw new Error("该分类仍有关联物品，请先迁移");
    }
    db.categories = db.categories.filter((cat) => cat.id !== id);
    setDb(db);
  }
  function migrateCategory(fromId, toId) {
    if (fromId === toId) {
      return;
    }
    const db = getDb();
    const fromExists = db.categories.some((item) => item.id === fromId);
    const toExists = db.categories.some((item) => item.id === toId);
    if (!fromExists || !toExists) {
      throw new Error("分类不存在");
    }
    db.items = db.items.map((item) => item.categoryId === fromId ? { ...item, categoryId: toId } : item);
    setDb(db);
  }
  function listReminders() {
    return getDb().reminders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  function createCustomReminder(payload) {
    const db = getDb();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const reminder = {
      id: createId("rem"),
      title: payload.title.trim(),
      note: (payload.note || "").trim(),
      itemId: "",
      type: "custom",
      status: "pending",
      dueDate: payload.dueDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      createdAt: now
    };
    db.reminders.unshift(reminder);
    setDb(db);
    return reminder;
  }
  function completeReminder(id) {
    const db = getDb();
    db.reminders = db.reminders.map((item) => item.id === id ? { ...item, status: "done" } : item);
    setDb(db);
  }
  function updateReminder(id, payload) {
    const db = getDb();
    const index = db.reminders.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error("提醒不存在");
    }
    const current = db.reminders[index];
    const next = {
      ...current,
      ...payload,
      title: payload.title !== void 0 ? payload.title.trim() : current.title,
      note: payload.note !== void 0 ? payload.note.trim() : current.note
    };
    db.reminders[index] = next;
    setDb(db);
    return next;
  }
  function completeAllReminders() {
    const db = getDb();
    db.reminders = db.reminders.map((item) => ({ ...item, status: "done" }));
    setDb(db);
  }
  function clearAllReminders() {
    const db = getDb();
    db.reminders = [];
    setDb(db);
  }
  function deleteReminder(id) {
    const db = getDb();
    db.reminders = db.reminders.filter((item) => item.id !== id);
    setDb(db);
  }
  function getAnalyticsSummary() {
    const db = getDb();
    const byCategory = db.categories.map((category) => ({
      name: category.name,
      count: db.items.filter((item) => item.categoryId === category.id).length
    }));
    const threshold = Number.isFinite(db.settings.dailyCostThreshold) && db.settings.dailyCostThreshold > 0 ? db.settings.dailyCostThreshold : 5;
    const idleThreshold = Number.isFinite(db.settings.idleThresholdDays) && db.settings.idleThresholdDays > 0 ? db.settings.idleThresholdDays : 60;
    const avgDailyCost = db.items.length === 0 ? 0 : Number((db.items.reduce((sum, item) => sum + dailyCost(item.price, item.purchaseDate), 0) / db.items.length).toFixed(2));
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
      byCategory
    };
  }
  function getSettings() {
    return normalizeSettings(getDb().settings);
  }
  function updateSettings(payload) {
    const db = getDb();
    db.settings = normalizeSettings({ ...db.settings, ...payload });
    setDb(db);
    syncSystemReminders();
    return db.settings;
  }
  function exportData() {
    incrementExportCount();
    const db = getDb();
    return JSON.stringify(db, null, 2);
  }
  function resetDemoData() {
    resetDb();
    uni.setStorageSync(EXPORT_COUNT_KEY, 0);
  }
  function importDataFromJson(jsonText) {
    let parsed;
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
      reminders: normalized.reminders.length
    };
  }
  function getExportCount() {
    const raw = uni.getStorageSync(EXPORT_COUNT_KEY);
    const num = Number(raw);
    return Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0;
  }
  function incrementExportCount() {
    const next = getExportCount() + 1;
    uni.setStorageSync(EXPORT_COUNT_KEY, next);
  }
  function isValidAppDb(data) {
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
    return db.categories.every((item) => isValidCategory(item)) && db.items.every((item) => isValidItem(item)) && db.reminders.every((item) => isValidReminder(item)) && isValidSettings(db.settings);
  }
  function syncSystemReminders() {
    const db = getDb();
    const settings = normalizeSettings(db.settings);
    db.settings = settings;
    const custom = db.reminders.filter((reminder) => reminder.type === "custom");
    const generated = [];
    db.items.forEach((item) => {
      const daily = dailyCost(item.price, item.purchaseDate);
      if (daily >= settings.dailyCostThreshold) {
        generated.push({
          id: createId("rem"),
          title: `"${item.name}" 日均成本偏高（${daily}/天）`,
          itemId: item.id,
          type: "high_daily_cost",
          status: "pending",
          dueDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
          dueDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    });
    const unique = /* @__PURE__ */ new Map();
    [...custom, ...generated].forEach((r) => {
      const key = `${r.itemId}_${r.type}_${r.title}`;
      if (!unique.has(key)) {
        unique.set(key, r);
      }
    });
    db.reminders = Array.from(unique.values());
    setDb(db);
  }
  function getItemExtra(item) {
    return {
      holdDays: holdDays(item.purchaseDate),
      dailyCost: dailyCost(item.price, item.purchaseDate)
    };
  }
  function normalizeImportedDb(db) {
    return {
      categories: db.categories.map((item) => ({
        id: item.id,
        name: item.name.trim(),
        createdAt: item.createdAt
      })),
      items: db.items.map((item) => ({
        ...item,
        name: item.name.trim(),
        note: item.note.trim(),
        icon: (item.icon || "").trim() || void 0,
        price: Number(item.price)
      })),
      reminders: db.reminders.map((item) => {
        var _a;
        return {
          ...item,
          title: item.title.trim(),
          note: (_a = item.note) == null ? void 0 : _a.trim()
        };
      }),
      settings: normalizeSettings(db.settings)
    };
  }
  function normalizeSettings(settings) {
    return {
      dailyCostThreshold: sanitizeFiniteNumber(settings.dailyCostThreshold, DEFAULT_DAILY_COST_THRESHOLD, 0.01),
      idleThresholdDays: Math.round(sanitizeFiniteNumber(settings.idleThresholdDays, DEFAULT_IDLE_THRESHOLD_DAYS, 1)),
      defaultReminderTime: sanitizeReminderTime(settings.defaultReminderTime)
    };
  }
  function sanitizeFiniteNumber(value, fallback, min) {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) {
      return fallback;
    }
    return Math.max(min, num);
  }
  function sanitizeReminderTime(value) {
    if (typeof value !== "string") {
      return DEFAULT_REMINDER_TIME;
    }
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value) ? value : DEFAULT_REMINDER_TIME;
  }
  function isRecord(value) {
    return !!value && typeof value === "object";
  }
  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }
  function isOptionalString(value) {
    return value === void 0 || typeof value === "string";
  }
  function isItemStatus(value) {
    return value === "active" || value === "idle" || value === "archived";
  }
  function isReminderType(value) {
    return value === "high_daily_cost" || value === "idle_check" || value === "custom";
  }
  function isReminderStatus(value) {
    return value === "pending" || value === "done";
  }
  function isValidCategory(data) {
    if (!isRecord(data)) {
      return false;
    }
    return isNonEmptyString(data.id) && isNonEmptyString(data.name) && isNonEmptyString(data.createdAt);
  }
  function isValidItem(data) {
    if (!isRecord(data)) {
      return false;
    }
    if (!isNonEmptyString(data.id) || !isNonEmptyString(data.name) || !isNonEmptyString(data.categoryId) || !Number.isFinite(data.price) || !isNonEmptyString(data.purchaseDate) || !isItemStatus(data.status) || typeof data.note !== "string" || !isNonEmptyString(data.createdAt) || !isNonEmptyString(data.updatedAt)) {
      return false;
    }
    return isOptionalString(data.lastUsedAt) && isOptionalString(data.icon);
  }
  function isValidReminder(data) {
    if (!isRecord(data)) {
      return false;
    }
    return isNonEmptyString(data.id) && isNonEmptyString(data.title) && isOptionalString(data.note) && typeof data.itemId === "string" && isReminderType(data.type) && isReminderStatus(data.status) && isNonEmptyString(data.dueDate) && isNonEmptyString(data.createdAt);
  }
  function isValidSettings(data) {
    if (!isRecord(data)) {
      return false;
    }
    return Number.isFinite(data.dailyCostThreshold) && Number.isFinite(data.idleThresholdDays) && typeof data.defaultReminderTime === "string";
  }
  const THEME_KEY = "writedown_mobile_theme";
  const THEME_CHANGED_EVENT = "theme:changed";
  function getThemeMode() {
    const value = uni.getStorageSync(THEME_KEY);
    return value === "dark" ? "dark" : "light";
  }
  function isDarkTheme() {
    return getThemeMode() === "dark";
  }
  function setThemeMode(mode) {
    uni.setStorageSync(THEME_KEY, mode);
    uni.$emit(THEME_CHANGED_EVENT, mode);
  }
  function toggleThemeMode() {
    const next = isDarkTheme() ? "light" : "dark";
    setThemeMode(next);
    return next;
  }
  const _sfc_main$d = /* @__PURE__ */ vue.defineComponent({
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const summary = vue.reactive({
        totalItems: 0,
        totalCost: 0,
        pendingReminders: 0,
        avgDailyCost: 0,
        newItemsThisMonth: 0
      });
      const categories = vue.ref(listCategories());
      const recentItems = vue.ref([]);
      const darkMode = vue.ref(isDarkTheme());
      const reminders = vue.ref([]);
      const quickEntries = vue.computed(() => [
        { label: "新增物品", icon: "➕", url: "/pages/add/index" },
        { label: "提醒", icon: "🔔", url: "/pages/reminders/index" },
        { label: "统计", icon: "📊", url: "/pages/analytics/index" },
        { label: "导出", icon: "⬇️", url: "/pages/data-export/index" }
      ]);
      onShow(() => {
        const data = getDashboardSummary();
        Object.assign(summary, data);
        categories.value = listCategories();
        recentItems.value = listItems({ sortBy: "updatedAt" }).slice(0, 3);
        refreshReminders();
        darkMode.value = isDarkTheme();
      });
      function refreshReminders() {
        reminders.value = listReminders().filter((item) => item.status === "pending").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 3).map((item) => ({
          id: item.id,
          title: item.title,
          note: item.note || reminderFallbackNote(item),
          date: formatDueDate(item.dueDate),
          leftText: dueLeftText(item.dueDate)
        }));
      }
      function formatDueDate(dateStr) {
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime()))
          return dateStr;
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
      function dueLeftText(dateStr) {
        const due = new Date(dateStr).getTime();
        if (!Number.isFinite(due))
          return "日期异常";
        const days = Math.ceil((due - Date.now()) / (1e3 * 60 * 60 * 24));
        if (days > 0)
          return `剩余 ${days} 天`;
        if (days === 0)
          return "今天到期";
        return `已逾期 ${Math.abs(days)} 天`;
      }
      function reminderFallbackNote(item) {
        if (item.type === "high_daily_cost")
          return "日均成本提醒";
        if (item.type === "idle_check")
          return "闲置检查提醒";
        return "提醒通知";
      }
      function go(url) {
        if (url === "/pages/dashboard/index" || url === "/pages/items/index" || url === "/pages/add/index" || url === "/pages/analytics/index" || url === "/pages/me/index") {
          uni.switchTab({ url });
          return;
        }
        uni.navigateTo({ url });
      }
      function goDetail(id) {
        uni.navigateTo({ url: `/pages/items/detail?id=${id}` });
      }
      function categoryName(id) {
        var _a;
        return ((_a = categories.value.find((it) => it.id === id)) == null ? void 0 : _a.name) || "未分类";
      }
      function handleToggleTheme() {
        darkMode.value = toggleThemeMode() === "dark";
      }
      const __returned__ = { summary, categories, recentItems, darkMode, reminders, quickEntries, refreshReminders, formatDueDate, dueLeftText, reminderFallbackNote, go, goDetail, categoryName, handleToggleTheme, get getItemExtra() {
        return getItemExtra;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-wrap" }, [
      vue.createElementVNode("view", { class: "header-row" }, [
        vue.createElementVNode("view", null, [
          vue.createElementVNode("view", { class: "page-subtitle" }, "一眼看清物品状态"),
          vue.createElementVNode("view", { class: "page-title" }, "首页总览")
        ]),
        vue.createElementVNode("view", { class: "header-actions" }, [
          vue.createElementVNode("view", {
            class: "icon-btn",
            onClick: _cache[0] || (_cache[0] = ($event) => $setup.go("/pages/items/index"))
          }, "🔍"),
          vue.createElementVNode("view", {
            class: "icon-btn",
            onClick: _cache[1] || (_cache[1] = ($event) => $setup.go("/pages/reminders/index"))
          }, "🔔"),
          vue.createElementVNode(
            "view",
            {
              class: "icon-btn",
              onClick: $setup.handleToggleTheme
            },
            vue.toDisplayString($setup.darkMode ? "☀️" : "🌙"),
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createElementVNode("view", { class: "gradient-banner" }, [
        vue.createElementVNode("view", { class: "banner-title" }, "当前物品资产概览"),
        vue.createElementVNode(
          "view",
          { class: "banner-main" },
          vue.toDisplayString($setup.summary.totalItems) + " 件",
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "view",
          { class: "banner-sub" },
          "累计投入 ¥" + vue.toDisplayString($setup.summary.totalCost),
          1
          /* TEXT */
        ),
        vue.createElementVNode("view", { class: "banner-grid" }, [
          vue.createElementVNode("view", { class: "banner-chip" }, [
            vue.createElementVNode("view", { class: "chip-label" }, "待提醒"),
            vue.createElementVNode(
              "view",
              { class: "chip-value" },
              vue.toDisplayString($setup.summary.pendingReminders),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "banner-chip" }, [
            vue.createElementVNode("view", { class: "chip-label" }, "本月新增"),
            vue.createElementVNode(
              "view",
              { class: "chip-value" },
              vue.toDisplayString($setup.summary.newItemsThisMonth),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "banner-chip" }, [
            vue.createElementVNode("view", { class: "chip-label" }, "日均成本"),
            vue.createElementVNode(
              "view",
              { class: "chip-value" },
              "¥" + vue.toDisplayString($setup.summary.avgDailyCost),
              1
              /* TEXT */
            )
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "quick-grid" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.quickEntries, (entry) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: entry.label,
              class: "card quick-item",
              onClick: ($event) => $setup.go(entry.url)
            }, [
              vue.createElementVNode(
                "view",
                { class: "soft-block quick-icon" },
                vue.toDisplayString(entry.icon),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "view",
                { class: "quick-label" },
                vue.toDisplayString(entry.label),
                1
                /* TEXT */
              )
            ], 8, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ]),
      vue.createElementVNode("view", null, [
        vue.createElementVNode("view", { class: "section-head" }, [
          vue.createElementVNode("view", { class: "section-title" }, "即将到期提醒"),
          vue.createElementVNode("view", {
            class: "section-link",
            onClick: _cache[2] || (_cache[2] = ($event) => $setup.go("/pages/reminders/index"))
          }, "查看全部")
        ]),
        vue.createElementVNode("view", { class: "reminder-list" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.reminders, (reminder) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: reminder.id,
                class: "card reminder-item",
                onClick: _cache[3] || (_cache[3] = ($event) => $setup.go("/pages/reminders/index"))
              }, [
                vue.createElementVNode("view", null, [
                  vue.createElementVNode(
                    "view",
                    { class: "item-title" },
                    vue.toDisplayString(reminder.title),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    { class: "item-sub" },
                    vue.toDisplayString(reminder.note),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "align-right" }, [
                  vue.createElementVNode(
                    "view",
                    { class: "item-title" },
                    vue.toDisplayString(reminder.date),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    { class: "item-sub" },
                    vue.toDisplayString(reminder.leftText),
                    1
                    /* TEXT */
                  )
                ])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          !$setup.reminders.length ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "card empty-reminder"
          }, "暂无待处理提醒")) : vue.createCommentVNode("v-if", true)
        ])
      ]),
      vue.createElementVNode("view", null, [
        vue.createElementVNode("view", { class: "section-head" }, [
          vue.createElementVNode("view", { class: "section-title" }, "最新记录"),
          vue.createElementVNode("view", {
            class: "section-link",
            onClick: _cache[4] || (_cache[4] = ($event) => $setup.go("/pages/items/index"))
          }, "进入列表")
        ]),
        vue.createElementVNode("view", { class: "recent-list" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.recentItems, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: item.id,
                class: "card recent-item",
                onClick: ($event) => $setup.goDetail(item.id)
              }, [
                vue.createElementVNode(
                  "view",
                  { class: "soft-block emoji" },
                  vue.toDisplayString(item.icon || "📦"),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "recent-main" }, [
                  vue.createElementVNode("view", { class: "line-top" }, [
                    vue.createElementVNode(
                      "view",
                      { class: "item-title" },
                      vue.toDisplayString(item.name),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      {
                        class: vue.normalizeClass(["status-tag", item.status === "active" ? "ok" : item.status === "idle" ? "warn" : "arch"])
                      },
                      vue.toDisplayString(item.status === "active" ? "使用中" : item.status === "idle" ? "闲置中" : "已弃用"),
                      3
                      /* TEXT, CLASS */
                    )
                  ]),
                  vue.createElementVNode(
                    "view",
                    { class: "item-sub" },
                    vue.toDisplayString($setup.categoryName(item.categoryId)) + " · 已持有 " + vue.toDisplayString($setup.getItemExtra(item).holdDays) + " 天",
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    { class: "item-title" },
                    "日均成本 ¥" + vue.toDisplayString($setup.getItemExtra(item).dailyCost),
                    1
                    /* TEXT */
                  )
                ])
              ], 8, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ]),
      vue.createElementVNode("button", {
        class: "all-btn",
        onClick: _cache[5] || (_cache[5] = ($event) => $setup.go("/pages/items/index"))
      }, "查看全部物品")
    ]);
  }
  const PagesDashboardIndex = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$c], ["__scopeId", "data-v-c7d6ac09"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/pages/dashboard/index.vue"]]);
  const ITEMS_CATEGORY_FILTER_KEY = "writedown_items_category_filter";
  const _sfc_main$c = /* @__PURE__ */ vue.defineComponent({
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const keyword = vue.ref("");
      const items = vue.ref([]);
      const categories = vue.ref(listCategories());
      const selectedCategoryId = vue.ref("");
      const status = vue.ref("all");
      const sortBy = vue.ref("updatedAt");
      const sortOrder = vue.ref("desc");
      const activeChip = vue.ref("all");
      const statusOptions = ["all", "active", "idle", "archived"];
      const statusNames = ["全部", "使用中", "闲置中", "已弃用"];
      const categoryNames = vue.computed(() => ["全部", ...categories.value.map((c) => c.name)]);
      const selectedCategoryName = vue.computed(() => {
        var _a;
        if (!selectedCategoryId.value) {
          return "全部";
        }
        return ((_a = categories.value.find((c) => c.id === selectedCategoryId.value)) == null ? void 0 : _a.name) || "全部";
      });
      const selectedCategoryIndex = vue.computed(() => {
        if (!selectedCategoryId.value) {
          return 0;
        }
        const idx = categories.value.findIndex((c) => c.id === selectedCategoryId.value);
        return idx < 0 ? 0 : idx + 1;
      });
      const selectedStatusIndex = vue.computed(() => Math.max(0, statusOptions.findIndex((item) => item === status.value)));
      const selectedStatusName = vue.computed(() => statusNames[selectedStatusIndex.value] || "全部");
      onShow(() => {
        categories.value = listCategories();
        applyPendingCategoryFilter();
        refresh();
      });
      function applyPendingCategoryFilter() {
        const raw = uni.getStorageSync(ITEMS_CATEGORY_FILTER_KEY);
        if (!raw || typeof raw !== "string") {
          return;
        }
        uni.removeStorageSync(ITEMS_CATEGORY_FILTER_KEY);
        try {
          const parsed = JSON.parse(raw);
          if (!parsed.categoryId) {
            return;
          }
          selectedCategoryId.value = parsed.categoryId;
          keyword.value = parsed.categoryName || "";
          activeChip.value = "all";
          sortBy.value = "updatedAt";
          sortOrder.value = "desc";
          status.value = "all";
        } catch {
        }
      }
      function refresh() {
        items.value = listItems({
          keyword: keyword.value,
          categoryId: selectedCategoryId.value,
          status: status.value,
          sortBy: sortBy.value,
          sortOrder: sortOrder.value
        });
      }
      function onCategoryChange(e) {
        const index = Number(e.detail.value);
        selectedCategoryId.value = index === 0 ? "" : categories.value[index - 1].id;
        refresh();
      }
      function onStatusChange(e) {
        status.value = statusOptions[Number(e.detail.value)];
        refresh();
      }
      function setSort(value) {
        sortBy.value = value;
        refresh();
      }
      function handleSortClick(value) {
        keyword.value = "";
        selectedCategoryId.value = "";
        status.value = "all";
        if (activeChip.value === value) {
          sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
        } else {
          sortOrder.value = "desc";
        }
        activeChip.value = value;
        setSort(value);
      }
      function setAll() {
        activeChip.value = "all";
        sortOrder.value = "desc";
        sortBy.value = "updatedAt";
        refresh();
      }
      function sortLabel(type, baseLabel) {
        if (activeChip.value !== type) {
          return baseLabel;
        }
        return `${baseLabel}${sortOrder.value === "desc" ? "↓" : "↑"}`;
      }
      function getCategoryName(categoryId) {
        var _a;
        return ((_a = categories.value.find((item) => item.id === categoryId)) == null ? void 0 : _a.name) || "未分类";
      }
      function statusText(value) {
        if (value === "active")
          return "使用中";
        if (value === "idle")
          return "闲置中";
        return "已弃用";
      }
      function itemEmoji(item) {
        if (item.icon)
          return item.icon;
        const name = getCategoryName(item.categoryId);
        if (name.includes("电子") || name.includes("数码"))
          return "📱";
        if (name.includes("家居"))
          return "🪑";
        if (name.includes("厨房"))
          return "☕";
        return "📦";
      }
      function tagClass(value) {
        if (value === "active")
          return "tag-active";
        if (value === "idle")
          return "tag-idle";
        return "tag-archived";
      }
      function goDetail(id) {
        uni.navigateTo({ url: `/pages/items/detail?id=${id}` });
      }
      const __returned__ = { ITEMS_CATEGORY_FILTER_KEY, keyword, items, categories, selectedCategoryId, status, sortBy, sortOrder, activeChip, statusOptions, statusNames, categoryNames, selectedCategoryName, selectedCategoryIndex, selectedStatusIndex, selectedStatusName, applyPendingCategoryFilter, refresh, onCategoryChange, onStatusChange, setSort, handleSortClick, setAll, sortLabel, getCategoryName, statusText, itemEmoji, tagClass, goDetail, get getItemExtra() {
        return getItemExtra;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-wrap" }, [
      vue.createElementVNode("view", null, [
        vue.createElementVNode("view", { class: "page-title" }, "物品列表"),
        vue.createElementVNode("view", { class: "page-subtitle" }, "筛选与管理物品")
      ]),
      vue.createElementVNode("view", { class: "card search-row" }, [
        vue.createElementVNode("view", { class: "search-icon" }, "🔍"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.keyword = $event),
            class: "search-input",
            placeholder: "搜索物品名称或分类",
            onInput: $setup.refresh
          },
          null,
          544
          /* NEED_HYDRATION, NEED_PATCH */
        ), [
          [vue.vModelText, $setup.keyword]
        ])
      ]),
      vue.createElementVNode("view", { class: "filter-row" }, [
        vue.createElementVNode("picker", {
          mode: "selector",
          range: $setup.categoryNames,
          value: $setup.selectedCategoryIndex,
          onChange: $setup.onCategoryChange
        }, [
          vue.createElementVNode(
            "view",
            { class: "filter-pill" },
            "分类：" + vue.toDisplayString($setup.selectedCategoryName),
            1
            /* TEXT */
          )
        ], 40, ["range", "value"]),
        vue.createElementVNode("picker", {
          mode: "selector",
          range: $setup.statusNames,
          value: $setup.selectedStatusIndex,
          onChange: $setup.onStatusChange
        }, [
          vue.createElementVNode(
            "view",
            { class: "filter-pill" },
            "状态：" + vue.toDisplayString($setup.selectedStatusName),
            1
            /* TEXT */
          )
        ], 40, ["value"])
      ]),
      vue.createElementVNode("view", { class: "filter-tags" }, [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["tag-btn", $setup.activeChip === "all" ? "tag-active-btn" : "tag-normal-btn"]),
            onClick: $setup.setAll
          },
          "全部",
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "button",
          {
            size: "mini",
            class: vue.normalizeClass(["sort-btn", $setup.activeChip === "updatedAt" ? "sort-btn-active" : ""]),
            onClick: _cache[1] || (_cache[1] = ($event) => $setup.handleSortClick("updatedAt"))
          },
          vue.toDisplayString($setup.sortLabel("updatedAt", "更新时间")),
          3
          /* TEXT, CLASS */
        ),
        vue.createElementVNode(
          "button",
          {
            size: "mini",
            class: vue.normalizeClass(["sort-btn", $setup.activeChip === "price" ? "sort-btn-active" : ""]),
            onClick: _cache[2] || (_cache[2] = ($event) => $setup.handleSortClick("price"))
          },
          vue.toDisplayString($setup.sortLabel("price", "价格")),
          3
          /* TEXT, CLASS */
        ),
        vue.createElementVNode(
          "button",
          {
            size: "mini",
            class: vue.normalizeClass(["sort-btn", $setup.activeChip === "dailyCost" ? "sort-btn-active" : ""]),
            onClick: _cache[3] || (_cache[3] = ($event) => $setup.handleSortClick("dailyCost"))
          },
          vue.toDisplayString($setup.sortLabel("dailyCost", "日均成本")),
          3
          /* TEXT, CLASS */
        )
      ]),
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($setup.items, (item) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: item.id,
            class: "card item-card",
            onClick: ($event) => $setup.goDetail(item.id)
          }, [
            vue.createElementVNode("view", { class: "row-top" }, [
              vue.createElementVNode(
                "view",
                { class: "emoji" },
                vue.toDisplayString($setup.itemEmoji(item)),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "content" }, [
                vue.createElementVNode("view", { class: "title-row" }, [
                  vue.createElementVNode(
                    "view",
                    { class: "item-name" },
                    vue.toDisplayString(item.name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    {
                      class: vue.normalizeClass(["status-badge", item.status === "active" ? "status-ok" : item.status === "idle" ? "status-warn" : "status-arch"])
                    },
                    vue.toDisplayString($setup.statusText(item.status)),
                    3
                    /* TEXT, CLASS */
                  )
                ]),
                vue.createElementVNode(
                  "view",
                  { class: "meta-row" },
                  vue.toDisplayString($setup.getCategoryName(item.categoryId)) + " · 购入 ¥" + vue.toDisplayString(item.price) + " · 持有 " + vue.toDisplayString($setup.getItemExtra(item).holdDays) + " 天",
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "foot-row" }, [
                  vue.createElementVNode("view", null, [
                    vue.createElementVNode("view", { class: "meta-label" }, "日均成本"),
                    vue.createElementVNode(
                      "view",
                      { class: "cost" },
                      "¥" + vue.toDisplayString($setup.getItemExtra(item).dailyCost),
                      1
                      /* TEXT */
                    )
                  ])
                ])
              ])
            ])
          ], 8, ["onClick"]);
        }),
        128
        /* KEYED_FRAGMENT */
      )),
      $setup.items.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "card empty"
      }, "暂无数据，先新增一条记录")) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesItemsIndex = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$b], ["__scopeId", "data-v-76e0e7d5"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/pages/items/index.vue"]]);
  const _sfc_main$b = /* @__PURE__ */ vue.defineComponent({
    __name: "AppModal",
    props: {
      visible: { type: Boolean, required: true },
      title: { type: String, required: true },
      message: { type: String, required: false, default: "" },
      showInput: { type: Boolean, required: false, default: false },
      inputPlaceholder: { type: String, required: false, default: "请输入" },
      initialInput: { type: String, required: false, default: "" },
      confirmText: { type: String, required: false, default: "确定" },
      cancelText: { type: String, required: false, default: "取消" },
      dangerConfirm: { type: Boolean, required: false, default: false },
      closeOnMask: { type: Boolean, required: false, default: true }
    },
    emits: ["update:visible", "confirm", "cancel"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props = __props;
      const emit = __emit;
      const innerInput = vue.ref("");
      vue.watch(
        () => props.visible,
        (show) => {
          if (show) {
            innerInput.value = props.initialInput || "";
          }
        },
        { immediate: true }
      );
      function close() {
        emit("update:visible", false);
      }
      function handleMaskClick() {
        if (!props.closeOnMask) {
          return;
        }
        emit("cancel");
        close();
      }
      function handleCancel() {
        emit("cancel");
        close();
      }
      function handleConfirm() {
        emit("confirm", innerInput.value);
        close();
      }
      const __returned__ = { props, emit, innerInput, close, handleMaskClick, handleCancel, handleConfirm };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    return $props.visible ? (vue.openBlock(), vue.createElementBlock("view", {
      key: 0,
      class: "modal-mask",
      onClick: $setup.handleMaskClick
    }, [
      vue.createElementVNode("view", {
        class: "modal-panel",
        onClick: _cache[1] || (_cache[1] = vue.withModifiers(() => {
        }, ["stop"]))
      }, [
        vue.createElementVNode(
          "view",
          { class: "modal-title" },
          vue.toDisplayString($props.title),
          1
          /* TEXT */
        ),
        $props.message ? (vue.openBlock(), vue.createElementBlock(
          "view",
          {
            key: 0,
            class: "modal-message"
          },
          vue.toDisplayString($props.message),
          1
          /* TEXT */
        )) : vue.createCommentVNode("v-if", true),
        $props.showInput ? vue.withDirectives((vue.openBlock(), vue.createElementBlock("input", {
          key: 1,
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.innerInput = $event),
          class: "modal-input",
          placeholder: $props.inputPlaceholder,
          maxlength: "30"
        }, null, 8, ["placeholder"])), [
          [vue.vModelText, $setup.innerInput]
        ]) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "modal-actions" }, [
          vue.createElementVNode(
            "button",
            {
              class: "modal-btn cancel-btn",
              onClick: $setup.handleCancel
            },
            vue.toDisplayString($props.cancelText),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "button",
            {
              class: vue.normalizeClass(["modal-btn", $props.dangerConfirm ? "danger-btn" : "confirm-btn"]),
              onClick: $setup.handleConfirm
            },
            vue.toDisplayString($props.confirmText),
            3
            /* TEXT, CLASS */
          )
        ])
      ])
    ])) : vue.createCommentVNode("v-if", true);
  }
  const AppModal = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$a], ["__scopeId", "data-v-537b826a"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/components/AppModal.vue"]]);
  const _sfc_main$a = /* @__PURE__ */ vue.defineComponent({
    __name: "index",
    setup(__props, { expose: __expose }) {
      var _a;
      __expose();
      const categories = vue.ref(listCategories());
      const statusOptions = ["active", "idle", "archived"];
      const statusOptionsText = ["使用中", "闲置中", "已弃用"];
      const sheetType = vue.ref("");
      const addCategoryModalVisible = vue.ref(false);
      const addReminderModalVisible = vue.ref(false);
      const iconModalVisible = vue.ref(false);
      const iconOptions = [
        { icon: "⌨️", label: "键盘" },
        { icon: "💻", label: "电脑" },
        { icon: "🎧", label: "耳机" },
        { icon: "📱", label: "手机" },
        { icon: "⌚", label: "手表" },
        { icon: "📷", label: "相机" },
        { icon: "🏠", label: "家居" },
        { icon: "🪑", label: "家具" },
        { icon: "👕", label: "服饰" },
        { icon: "📦", label: "用品" },
        { icon: "📚", label: "书籍" },
        { icon: "☕", label: "消耗" }
      ];
      const form = vue.reactive({
        name: "",
        icon: "📦",
        categoryId: ((_a = categories.value[0]) == null ? void 0 : _a.id) || "",
        price: 0,
        purchaseDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        status: "active",
        note: ""
      });
      const reminderForm = vue.reactive({
        title: "",
        note: "",
        dueDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
      });
      const categoryNames = vue.computed(() => categories.value.map((item) => item.name));
      const selectedCategoryName = vue.computed(() => {
        var _a2;
        return ((_a2 = categories.value.find((item) => item.id === form.categoryId)) == null ? void 0 : _a2.name) || "未分类";
      });
      const selectedIconOption = vue.computed(() => iconOptions.find((item) => item.icon === form.icon) || iconOptions[0]);
      const sheetOptions = vue.computed(() => sheetType.value === "category" ? categoryNames.value : statusOptionsText);
      const sheetSelectedIndex = vue.computed(() => {
        if (sheetType.value === "category") {
          const idx = categories.value.findIndex((item) => item.id === form.categoryId);
          return idx < 0 ? 0 : idx;
        }
        return Math.max(0, statusOptions.findIndex((item) => item === form.status));
      });
      const previewHoldDays = vue.computed(() => {
        const start = new Date(form.purchaseDate).getTime();
        const now = (/* @__PURE__ */ new Date()).getTime();
        if (!Number.isFinite(start))
          return 0;
        return Math.max(0, Math.floor((now - start) / (1e3 * 60 * 60 * 24)));
      });
      const previewDailyCost = vue.computed(() => {
        if (!form.price || form.price <= 0)
          return "0.00";
        return dailyCost(form.price, form.purchaseDate).toFixed(2);
      });
      function openSheet(type) {
        if (type === "category" && !categoryNames.value.length) {
          uni.showToast({ title: "暂无分类，请先新增", icon: "none" });
          return;
        }
        sheetType.value = type;
      }
      function closeSheet() {
        sheetType.value = "";
      }
      function selectSheetOption(index) {
        if (sheetType.value === "category") {
          form.categoryId = categories.value[index].id;
        } else {
          form.status = statusOptions[index];
        }
        closeSheet();
      }
      function onDateChange(e) {
        form.purchaseDate = e.detail.value;
      }
      function statusText(value) {
        if (value === "active")
          return "使用中";
        if (value === "idle")
          return "闲置中";
        return "已弃用";
      }
      function handleQuickAddCategory() {
        addCategoryModalVisible.value = true;
      }
      function openIconModal() {
        iconModalVisible.value = true;
      }
      function closeIconModal() {
        iconModalVisible.value = false;
      }
      function selectIcon(icon) {
        form.icon = icon;
        closeIconModal();
      }
      function confirmQuickAddCategory(inputValue) {
        const name = (inputValue || "").trim();
        if (!name) {
          uni.showToast({ title: "分类名称不能为空", icon: "none" });
          return;
        }
        try {
          const created = addCategory(name);
          categories.value = listCategories();
          form.categoryId = created.id;
          uni.showToast({ title: "分类已新增", icon: "success" });
        } catch (err) {
          uni.showToast({ title: err.message, icon: "none" });
        }
      }
      function openAddReminderModal() {
        reminderForm.title = "";
        reminderForm.note = "";
        reminderForm.dueDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        addReminderModalVisible.value = true;
      }
      function onReminderDateChange(e) {
        reminderForm.dueDate = e.detail.value;
      }
      function confirmAddReminder() {
        const title = reminderForm.title.trim();
        if (!title) {
          uni.showToast({ title: "请输入提醒标题", icon: "none" });
          return;
        }
        createCustomReminder({
          title,
          note: reminderForm.note,
          dueDate: reminderForm.dueDate
        });
        addReminderModalVisible.value = false;
        uni.showToast({ title: "提醒已新增", icon: "success" });
      }
      function resetForm() {
        form.name = "";
        form.icon = "📦";
        form.price = 0;
        form.note = "";
        form.purchaseDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        form.status = "active";
        closeSheet();
      }
      function handleCancel() {
        resetForm();
        uni.showToast({ title: "已取消当前编辑", icon: "none" });
      }
      function handleCreate() {
        if (!form.name.trim()) {
          uni.showToast({ title: "请输入物品名称", icon: "none" });
          return;
        }
        if (form.price <= 0) {
          uni.showToast({ title: "价格必须大于 0", icon: "none" });
          return;
        }
        createItem({ ...form });
        uni.showToast({ title: "新增成功", icon: "success" });
        resetForm();
        uni.switchTab({ url: "/pages/items/index" });
      }
      const __returned__ = { categories, statusOptions, statusOptionsText, sheetType, addCategoryModalVisible, addReminderModalVisible, iconModalVisible, iconOptions, form, reminderForm, categoryNames, selectedCategoryName, selectedIconOption, sheetOptions, sheetSelectedIndex, previewHoldDays, previewDailyCost, openSheet, closeSheet, selectSheetOption, onDateChange, statusText, handleQuickAddCategory, openIconModal, closeIconModal, selectIcon, confirmQuickAddCategory, openAddReminderModal, onReminderDateChange, confirmAddReminder, resetForm, handleCancel, handleCreate, AppModal };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-wrap" }, [
      vue.createElementVNode("view", { class: "top-head card" }, [
        vue.createElementVNode("view", null, [
          vue.createElementVNode("view", { class: "page-title" }, "新增物品"),
          vue.createElementVNode("view", { class: "page-subtitle" }, "记录购置与使用状态")
        ]),
        vue.createElementVNode("view", { class: "head-right" }, [
          vue.createElementVNode("view", {
            class: "category-btn",
            onClick: $setup.openAddReminderModal
          }, "新增提醒"),
          vue.createElementVNode("view", {
            class: "category-btn",
            onClick: $setup.handleQuickAddCategory
          }, "新增分类")
        ])
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "section-title" }, "基础信息"),
        vue.createElementVNode("view", { class: "field-label" }, "物品名称"),
        vue.createElementVNode("view", { class: "name-row" }, [
          vue.createElementVNode("view", {
            class: "name-icon",
            onClick: $setup.openIconModal
          }, [
            vue.createElementVNode(
              "view",
              { class: "name-emoji" },
              vue.toDisplayString($setup.selectedIconOption.icon),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "name-icon-tip" }, "更换")
          ]),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.form.name = $event),
              class: "input name-input",
              placeholder: "例如：MacBook Air / 电动牙刷 / 豆包会员"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $setup.form.name]
          ])
        ]),
        vue.createElementVNode("view", { class: "split-line" }),
        vue.createElementVNode("view", { class: "field-label" }, "分类"),
        vue.createElementVNode("view", {
          class: "picker",
          onClick: _cache[1] || (_cache[1] = ($event) => $setup.openSheet("category"))
        }, [
          vue.createTextVNode(
            vue.toDisplayString($setup.selectedCategoryName) + " ",
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "arrow" }, "›")
        ]),
        vue.createElementVNode("view", { class: "field-label" }, "状态"),
        vue.createElementVNode("view", {
          class: "picker",
          onClick: _cache[2] || (_cache[2] = ($event) => $setup.openSheet("status"))
        }, [
          vue.createTextVNode(
            vue.toDisplayString($setup.statusText($setup.form.status)) + " ",
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "arrow" }, "›")
        ]),
        vue.createElementVNode("view", { class: "field-label" }, "购买日期"),
        vue.createElementVNode("picker", {
          mode: "date",
          value: $setup.form.purchaseDate,
          start: "2000-01-01",
          end: "2099-12-31",
          onChange: $setup.onDateChange
        }, [
          vue.createElementVNode("view", { class: "picker date-picker" }, [
            vue.createElementVNode("text", { class: "calendar-icon" }, "📅"),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($setup.form.purchaseDate),
              1
              /* TEXT */
            )
          ])
        ], 40, ["value"]),
        vue.createElementVNode("view", { class: "field-label" }, "购买价格"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.form.price = $event),
            class: "input",
            type: "digit",
            placeholder: "请输入购买价格，如 6999"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [
            vue.vModelText,
            $setup.form.price,
            void 0,
            { number: true }
          ]
        ])
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "section-title" }, "使用预览"),
        vue.createElementVNode("view", { class: "preview-metrics" }, [
          vue.createElementVNode("view", { class: "metric-box" }, [
            vue.createElementVNode(
              "view",
              { class: "metric-value" },
              vue.toDisplayString($setup.previewHoldDays) + " 天",
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "metric-label" }, "持有时长")
          ]),
          vue.createElementVNode("view", { class: "metric-box" }, [
            vue.createElementVNode(
              "view",
              { class: "metric-value" },
              "¥ " + vue.toDisplayString($setup.previewDailyCost),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "metric-label" }, "日均成本")
          ])
        ]),
        vue.createElementVNode(
          "view",
          { class: "preview-tip" },
          "预览按演示日期 " + vue.toDisplayString($setup.form.purchaseDate) + " 计算，方便你在画布里稳定查看效果。",
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "section-title" }, "补充说明"),
        vue.createElementVNode("view", { class: "field-label" }, "备注"),
        vue.withDirectives(vue.createElementVNode(
          "textarea",
          {
            "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.form.note = $event),
            class: "textarea",
            placeholder: "可记录使用感受、保修时间、购买渠道等"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.form.note]
        ]),
        vue.createElementVNode("view", { class: "row" }, [
          vue.createElementVNode("button", {
            class: "soft-btn",
            onClick: $setup.handleCancel
          }, "取消"),
          vue.createElementVNode("button", {
            class: "primary-btn",
            onClick: $setup.handleCreate
          }, "保存")
        ])
      ]),
      $setup.sheetType ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "sheet-mask",
        onClick: $setup.closeSheet
      })) : vue.createCommentVNode("v-if", true),
      $setup.sheetType ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "bottom-sheet"
      }, [
        vue.createElementVNode("view", { class: "sheet-head" }, [
          vue.createElementVNode(
            "view",
            { class: "sheet-title" },
            vue.toDisplayString($setup.sheetType === "category" ? "选择分类" : "选择状态"),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", {
            class: "sheet-close",
            onClick: $setup.closeSheet
          }, "关闭")
        ]),
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.sheetOptions, (option, idx) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: option,
              class: "sheet-item",
              onClick: ($event) => $setup.selectSheetOption(idx)
            }, [
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["sheet-text", idx === $setup.sheetSelectedIndex ? "sheet-text-active" : ""])
                },
                vue.toDisplayString(option),
                3
                /* TEXT, CLASS */
              ),
              idx === $setup.sheetSelectedIndex ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "sheet-check"
              }, "✓")) : vue.createCommentVNode("v-if", true)
            ], 8, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])) : vue.createCommentVNode("v-if", true),
      vue.createVNode($setup["AppModal"], {
        visible: $setup.addCategoryModalVisible,
        "onUpdate:visible": _cache[5] || (_cache[5] = ($event) => $setup.addCategoryModalVisible = $event),
        title: "新增分类",
        showInput: true,
        "input-placeholder": "输入分类名称",
        onConfirm: $setup.confirmQuickAddCategory
      }, null, 8, ["visible"]),
      $setup.addReminderModalVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "sheet-mask",
        onClick: _cache[6] || (_cache[6] = ($event) => $setup.addReminderModalVisible = false)
      })) : vue.createCommentVNode("v-if", true),
      $setup.addReminderModalVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "reminder-panel"
      }, [
        vue.createElementVNode("view", { class: "sheet-head" }, [
          vue.createElementVNode("view", { class: "sheet-title" }, "新增提醒"),
          vue.createElementVNode("view", {
            class: "sheet-close",
            onClick: _cache[7] || (_cache[7] = ($event) => $setup.addReminderModalVisible = false)
          }, "关闭")
        ]),
        vue.createElementVNode("view", { class: "reminder-body" }, [
          vue.createElementVNode("view", { class: "field-label" }, "提醒标题"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => $setup.reminderForm.title = $event),
              class: "input",
              placeholder: "例如：清洁键盘 / 更换滤芯"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $setup.reminderForm.title]
          ]),
          vue.createElementVNode("view", { class: "field-label" }, "备注"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => $setup.reminderForm.note = $event),
              class: "input",
              placeholder: "可选，作为小字显示"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $setup.reminderForm.note]
          ]),
          vue.createElementVNode("view", { class: "field-label" }, "日期"),
          vue.createElementVNode("picker", {
            mode: "date",
            value: $setup.reminderForm.dueDate,
            start: "2000-01-01",
            end: "2099-12-31",
            onChange: $setup.onReminderDateChange
          }, [
            vue.createElementVNode("view", { class: "picker date-picker" }, [
              vue.createElementVNode("text", { class: "calendar-icon" }, "📅"),
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($setup.reminderForm.dueDate),
                1
                /* TEXT */
              )
            ])
          ], 40, ["value"]),
          vue.createElementVNode("view", { class: "row reminder-actions" }, [
            vue.createElementVNode("button", {
              class: "soft-btn",
              onClick: _cache[10] || (_cache[10] = ($event) => $setup.addReminderModalVisible = false)
            }, "取消"),
            vue.createElementVNode("button", {
              class: "primary-btn",
              onClick: $setup.confirmAddReminder
            }, "确定")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.iconModalVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 4,
        class: "sheet-mask",
        onClick: $setup.closeIconModal
      })) : vue.createCommentVNode("v-if", true),
      $setup.iconModalVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 5,
        class: "icon-modal"
      }, [
        vue.createElementVNode("view", { class: "icon-modal-head" }, [
          vue.createElementVNode("view", { class: "sheet-title" }, "选择图标"),
          vue.createElementVNode("view", {
            class: "sheet-close",
            onClick: $setup.closeIconModal
          }, "✕")
        ]),
        vue.createElementVNode("view", { class: "icon-grid" }, [
          (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.iconOptions, (option) => {
              return vue.createElementVNode("view", {
                key: option.icon,
                class: vue.normalizeClass(["icon-card", $setup.form.icon === option.icon ? "icon-card-active" : ""]),
                onClick: ($event) => $setup.selectIcon(option.icon)
              }, [
                vue.createElementVNode(
                  "view",
                  { class: "icon-card-emoji" },
                  vue.toDisplayString(option.icon),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  { class: "icon-card-label" },
                  vue.toDisplayString(option.label),
                  1
                  /* TEXT */
                )
              ], 10, ["onClick"]);
            }),
            64
            /* STABLE_FRAGMENT */
          ))
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesAddIndex = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$9], ["__scopeId", "data-v-602d3812"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/pages/add/index.vue"]]);
  const _sfc_main$9 = /* @__PURE__ */ vue.defineComponent({
    __name: "detail",
    setup(__props, { expose: __expose }) {
      __expose();
      const item = vue.ref();
      const categories = listCategories();
      const id = vue.ref("");
      const deleteModalVisible = vue.ref(false);
      const extra = vue.computed(() => item.value ? getItemExtra(item.value) : { holdDays: 0, dailyCost: 0 });
      const categoryName = vue.computed(
        () => {
          var _a;
          return ((_a = categories.find((category) => {
            var _a2;
            return category.id === ((_a2 = item.value) == null ? void 0 : _a2.categoryId);
          })) == null ? void 0 : _a.name) || "未分类";
        }
      );
      const reminderText = vue.computed(() => {
        if (!item.value)
          return "无提醒";
        return item.value.status === "active" ? "建议 90 天维护一次" : "无提醒";
      });
      const recentUsedAtText = vue.computed(() => {
        if (!item.value)
          return "-";
        return item.value.lastUsedAt || "-";
      });
      const itemEmoji = vue.computed(() => {
        var _a;
        if ((_a = item.value) == null ? void 0 : _a.icon)
          return item.value.icon;
        const name = categoryName.value;
        if (name.includes("电子") || name.includes("数码"))
          return "📱";
        if (name.includes("家居"))
          return "🪑";
        if (name.includes("厨房"))
          return "☕";
        return "📦";
      });
      onLoad((query) => {
        id.value = String((query == null ? void 0 : query.id) || "");
        const data = getItemById(id.value);
        if (!data) {
          uni.showToast({ title: "物品不存在", icon: "none" });
          uni.navigateBack();
          return;
        }
        item.value = data;
      });
      function goEdit() {
        uni.navigateTo({ url: `/pages/items/edit?id=${id.value}` });
      }
      function handleUse() {
        item.value = markItemUsed(id.value);
        uni.showToast({ title: "已记录", icon: "success" });
      }
      function handleDelete() {
        deleteModalVisible.value = true;
      }
      function confirmDelete() {
        deleteItem(id.value);
        uni.showToast({ title: "已删除", icon: "success" });
        uni.navigateBack();
      }
      const __returned__ = { item, categories, id, deleteModalVisible, extra, categoryName, reminderText, recentUsedAtText, itemEmoji, goEdit, handleUse, handleDelete, confirmDelete, AppModal };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    return $setup.item ? (vue.openBlock(), vue.createElementBlock("view", {
      key: 0,
      class: "page-wrap"
    }, [
      vue.createElementVNode("view", { class: "card hero-card" }, [
        vue.createElementVNode("view", { class: "card-actions" }, [
          vue.createElementVNode("button", {
            size: "mini",
            class: "soft-btn action-btn",
            onClick: $setup.goEdit
          }, "编辑")
        ]),
        vue.createElementVNode(
          "view",
          { class: "hero-icon" },
          vue.toDisplayString($setup.itemEmoji),
          1
          /* TEXT */
        ),
        vue.createElementVNode("view", { class: "title-row" }, [
          vue.createElementVNode("view", null, [
            vue.createElementVNode(
              "view",
              { class: "page-title" },
              vue.toDisplayString($setup.item.name),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "view",
              { class: "page-subtitle" },
              vue.toDisplayString($setup.categoryName),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["status", $setup.item.status === "active" ? "ok" : $setup.item.status === "idle" ? "warn" : "arch"])
            },
            vue.toDisplayString($setup.item.status === "active" ? "使用中" : $setup.item.status === "idle" ? "闲置中" : "已弃用"),
            3
            /* TEXT, CLASS */
          )
        ]),
        vue.createElementVNode("view", { class: "metrics" }, [
          vue.createElementVNode("view", { class: "soft-block metric-item" }, [
            vue.createElementVNode("view", { class: "metric-label" }, "购入价格"),
            vue.createElementVNode(
              "view",
              { class: "metric-value" },
              "¥" + vue.toDisplayString($setup.item.price),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "soft-block metric-item" }, [
            vue.createElementVNode("view", { class: "metric-label" }, "持有时长"),
            vue.createElementVNode(
              "view",
              { class: "metric-value" },
              vue.toDisplayString($setup.extra.holdDays) + " 天",
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "soft-block metric-item" }, [
            vue.createElementVNode("view", { class: "metric-label" }, "日均成本"),
            vue.createElementVNode(
              "view",
              { class: "metric-value" },
              "¥" + vue.toDisplayString($setup.extra.dailyCost),
              1
              /* TEXT */
            )
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "section-title" }, "基础信息"),
        vue.createElementVNode("view", { class: "line" }, [
          vue.createElementVNode("text", null, "购买日期"),
          vue.createElementVNode(
            "text",
            null,
            vue.toDisplayString($setup.item.purchaseDate),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "line" }, [
          vue.createElementVNode("text", null, "最近使用时间"),
          vue.createElementVNode(
            "text",
            null,
            vue.toDisplayString($setup.recentUsedAtText),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "line" }, [
          vue.createElementVNode("text", null, "最近提醒"),
          vue.createElementVNode(
            "text",
            null,
            vue.toDisplayString($setup.reminderText),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "line" }, [
          vue.createElementVNode("text", null, "备注"),
          vue.createElementVNode(
            "text",
            null,
            vue.toDisplayString($setup.item.note || "-"),
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createElementVNode("view", { class: "action-row" }, [
        vue.createElementVNode("button", {
          class: "action-btn",
          onClick: $setup.handleUse
        }, "记录一次使用"),
        vue.createElementVNode("button", {
          class: "danger-btn action-btn",
          onClick: $setup.handleDelete
        }, "删除")
      ]),
      vue.createVNode($setup["AppModal"], {
        visible: $setup.deleteModalVisible,
        "onUpdate:visible": _cache[0] || (_cache[0] = ($event) => $setup.deleteModalVisible = $event),
        title: "确认删除",
        message: "删除后不可恢复",
        dangerConfirm: true,
        "confirm-text": "删除",
        onConfirm: $setup.confirmDelete
      }, null, 8, ["visible"])
    ])) : vue.createCommentVNode("v-if", true);
  }
  const PagesItemsDetail = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$8], ["__scopeId", "data-v-e662cade"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/pages/items/detail.vue"]]);
  const _sfc_main$8 = /* @__PURE__ */ vue.defineComponent({
    __name: "edit",
    setup(__props, { expose: __expose }) {
      var _a;
      __expose();
      const id = vue.ref("");
      const isEdit = vue.computed(() => Boolean(id.value));
      const categories = vue.ref(listCategories());
      const statusOptions = ["active", "idle", "archived"];
      const statusLabels = ["使用中", "闲置中", "已弃用"];
      const deleteModalVisible = vue.ref(false);
      const form = vue.reactive({
        name: "",
        categoryId: ((_a = categories.value[0]) == null ? void 0 : _a.id) || "",
        price: 0,
        purchaseDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        status: "active",
        note: ""
      });
      const categoryNames = vue.computed(() => categories.value.map((item) => item.name));
      const selectedCategoryName = vue.computed(() => {
        var _a2;
        return ((_a2 = categories.value.find((item) => item.id === form.categoryId)) == null ? void 0 : _a2.name) || "未分类";
      });
      const selectedCategoryIndex = vue.computed(() => Math.max(0, categories.value.findIndex((item) => item.id === form.categoryId)));
      const selectedStatusIndex = vue.computed(() => Math.max(0, statusOptions.indexOf(form.status)));
      const previewHoldDays = vue.computed(() => {
        const start = new Date(form.purchaseDate).getTime();
        const now = Date.now();
        if (!Number.isFinite(start))
          return 0;
        return Math.max(0, Math.floor((now - start) / (1e3 * 60 * 60 * 24)));
      });
      const previewDailyCost = vue.computed(() => {
        if (!form.price || form.price <= 0)
          return "0.00";
        return dailyCost(form.price, form.purchaseDate).toFixed(2);
      });
      onLoad((query) => {
        categories.value = listCategories();
        if (!categories.value.length) {
          uni.showToast({ title: "请先创建分类", icon: "none" });
          uni.navigateBack();
          return;
        }
        if (!form.categoryId) {
          form.categoryId = categories.value[0].id;
        }
        if (query == null ? void 0 : query.id) {
          id.value = String(query.id);
          const item = getItemById(id.value);
          if (!item) {
            uni.showToast({ title: "数据不存在", icon: "none" });
            uni.navigateBack();
            return;
          }
          Object.assign(form, {
            name: item.name,
            categoryId: item.categoryId,
            price: item.price,
            purchaseDate: item.purchaseDate,
            status: item.status,
            note: item.note
          });
        }
      });
      function onCategoryChange(e) {
        form.categoryId = categories.value[Number(e.detail.value)].id;
      }
      function onStatusChange(e) {
        form.status = statusOptions[Number(e.detail.value)];
      }
      function onDateChange(e) {
        form.purchaseDate = e.detail.value;
      }
      function statusLabel(value) {
        if (value === "active")
          return "使用中";
        if (value === "idle")
          return "闲置中";
        return "已弃用";
      }
      function handleSave() {
        if (!form.name.trim()) {
          uni.showToast({ title: "请输入名称", icon: "none" });
          return;
        }
        if (form.price <= 0) {
          uni.showToast({ title: "价格必须大于 0", icon: "none" });
          return;
        }
        if (isEdit.value) {
          updateItem(id.value, { ...form });
          uni.showToast({ title: "已更新", icon: "success" });
        } else {
          createItem({ ...form });
          uni.showToast({ title: "已创建", icon: "success" });
        }
        setTimeout(() => uni.navigateBack(), 200);
      }
      function handleDelete() {
        deleteModalVisible.value = true;
      }
      function confirmDelete() {
        deleteItem(id.value);
        uni.showToast({ title: "已删除", icon: "success" });
        setTimeout(() => uni.navigateBack(), 200);
      }
      const __returned__ = { id, isEdit, categories, statusOptions, statusLabels, deleteModalVisible, form, categoryNames, selectedCategoryName, selectedCategoryIndex, selectedStatusIndex, previewHoldDays, previewDailyCost, onCategoryChange, onStatusChange, onDateChange, statusLabel, handleSave, handleDelete, confirmDelete, AppModal };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-wrap" }, [
      vue.createElementVNode("view", { class: "card top-head" }, [
        vue.createElementVNode("view", null, [
          vue.createElementVNode(
            "view",
            { class: "page-title" },
            vue.toDisplayString($setup.isEdit ? "编辑物品" : "新增物品"),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", { class: "page-subtitle" }, "保持记录完整，方便后续查看成本变化")
        ])
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "section-title" }, "基础信息"),
        vue.createElementVNode("view", { class: "field-label" }, "物品名称"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.form.name = $event),
            class: "input",
            placeholder: "例如：机械键盘 / 咖啡机"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.form.name]
        ]),
        vue.createElementVNode("view", { class: "split-line" }),
        vue.createElementVNode("view", { class: "field-label" }, "分类"),
        vue.createElementVNode("picker", {
          mode: "selector",
          range: $setup.categoryNames,
          value: $setup.selectedCategoryIndex,
          onChange: $setup.onCategoryChange
        }, [
          vue.createElementVNode("view", { class: "picker" }, [
            vue.createTextVNode(
              vue.toDisplayString($setup.selectedCategoryName) + " ",
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "arrow" }, "›")
          ])
        ], 40, ["range", "value"]),
        vue.createElementVNode("view", { class: "field-label" }, "状态"),
        vue.createElementVNode("picker", {
          mode: "selector",
          range: $setup.statusLabels,
          value: $setup.selectedStatusIndex,
          onChange: $setup.onStatusChange
        }, [
          vue.createElementVNode("view", { class: "picker" }, [
            vue.createTextVNode(
              vue.toDisplayString($setup.statusLabel($setup.form.status)) + " ",
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "arrow" }, "›")
          ])
        ], 40, ["value"]),
        vue.createElementVNode("view", { class: "field-label" }, "购买日期"),
        vue.createElementVNode("picker", {
          mode: "date",
          value: $setup.form.purchaseDate,
          start: "2000-01-01",
          end: "2099-12-31",
          onChange: $setup.onDateChange
        }, [
          vue.createElementVNode("view", { class: "picker date-picker" }, [
            vue.createElementVNode("text", { class: "calendar-icon" }, "📅"),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($setup.form.purchaseDate),
              1
              /* TEXT */
            )
          ])
        ], 40, ["value"]),
        vue.createElementVNode("view", { class: "field-label" }, "购买价格"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.form.price = $event),
            class: "input",
            type: "digit",
            placeholder: "请输入价格"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [
            vue.vModelText,
            $setup.form.price,
            void 0,
            { number: true }
          ]
        ])
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "section-title" }, "使用预览"),
        vue.createElementVNode("view", { class: "preview-metrics" }, [
          vue.createElementVNode("view", { class: "metric-box" }, [
            vue.createElementVNode(
              "view",
              { class: "metric-value" },
              vue.toDisplayString($setup.previewHoldDays) + " 天",
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "metric-label" }, "持有时长")
          ]),
          vue.createElementVNode("view", { class: "metric-box" }, [
            vue.createElementVNode(
              "view",
              { class: "metric-value" },
              "¥ " + vue.toDisplayString($setup.previewDailyCost),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "metric-label" }, "日均成本")
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "section-title" }, "补充说明"),
        vue.createElementVNode("view", { class: "field-label" }, "备注"),
        vue.withDirectives(vue.createElementVNode(
          "textarea",
          {
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.form.note = $event),
            class: "textarea",
            placeholder: "记录使用感受、保养时间或购买渠道"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.form.note]
        ]),
        vue.createElementVNode("view", { class: "row" }, [
          vue.createElementVNode("button", {
            class: "primary-btn",
            onClick: $setup.handleSave
          }, "保存"),
          $setup.isEdit ? (vue.openBlock(), vue.createElementBlock("button", {
            key: 0,
            class: "danger-btn",
            onClick: $setup.handleDelete
          }, "删除")) : vue.createCommentVNode("v-if", true)
        ])
      ]),
      vue.createVNode($setup["AppModal"], {
        visible: $setup.deleteModalVisible,
        "onUpdate:visible": _cache[3] || (_cache[3] = ($event) => $setup.deleteModalVisible = $event),
        title: "确认删除",
        message: "删除后不可恢复",
        dangerConfirm: true,
        "confirm-text": "删除",
        onConfirm: $setup.confirmDelete
      }, null, 8, ["visible"])
    ]);
  }
  const PagesItemsEdit = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$7], ["__scopeId", "data-v-7c2c3502"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/pages/items/edit.vue"]]);
  const _sfc_main$7 = /* @__PURE__ */ vue.defineComponent({
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const categories = vue.ref([]);
      const newName = vue.ref("");
      const renameModalVisible = vue.ref(false);
      const renameTargetId = vue.ref("");
      const renameInitialName = vue.ref("");
      onShow(refresh);
      function refresh() {
        categories.value = listCategories();
      }
      function countItems(categoryId) {
        return listItems({ categoryId }).length;
      }
      function handleAdd() {
        if (!newName.value.trim()) {
          uni.showToast({ title: "请输入分类名称", icon: "none" });
          return;
        }
        try {
          addCategory(newName.value);
          newName.value = "";
          refresh();
        } catch (err) {
          uni.showToast({ title: err.message, icon: "none" });
        }
      }
      function handleRename(id) {
        var _a;
        renameTargetId.value = id;
        renameInitialName.value = ((_a = categories.value.find((item) => item.id === id)) == null ? void 0 : _a.name) || "";
        renameModalVisible.value = true;
      }
      function confirmRename(inputValue) {
        const name = (inputValue || "").trim();
        if (!name || !renameTargetId.value) {
          return;
        }
        try {
          renameCategory(renameTargetId.value, name);
          refresh();
        } catch (err) {
          uni.showToast({ title: err.message, icon: "none" });
        }
      }
      function handleMigrate(fromId) {
        const targets = categories.value.filter((item) => item.id !== fromId);
        if (!targets.length) {
          uni.showToast({ title: "至少需要两个分类", icon: "none" });
          return;
        }
        uni.showActionSheet({
          itemList: targets.map((item) => item.name),
          success: (res) => {
            const target = targets[res.tapIndex];
            if (!target) {
              return;
            }
            migrateCategory(fromId, target.id);
            uni.showToast({ title: `已迁移到${target.name}`, icon: "none" });
            refresh();
          }
        });
      }
      function handleDelete(id) {
        try {
          deleteCategory(id);
          refresh();
        } catch (err) {
          uni.showToast({ title: err.message, icon: "none" });
        }
      }
      function goItemsByCategory(category) {
        uni.setStorageSync("writedown_items_category_filter", JSON.stringify({
          categoryId: category.id,
          categoryName: category.name
        }));
        uni.switchTab({ url: "/pages/items/index" });
      }
      const __returned__ = { categories, newName, renameModalVisible, renameTargetId, renameInitialName, refresh, countItems, handleAdd, handleRename, confirmRename, handleMigrate, handleDelete, goItemsByCategory, AppModal };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-wrap" }, [
      vue.createElementVNode("view", null, [
        vue.createElementVNode("view", { class: "page-title" }, "分类管理"),
        vue.createElementVNode("view", { class: "page-subtitle" }, "管理分类与迁移")
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "field-label" }, "新增分类名称"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.newName = $event),
            class: "input",
            placeholder: "请输入分类名称"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.newName]
        ]),
        vue.createElementVNode("button", {
          class: "primary-btn create-btn",
          onClick: $setup.handleAdd
        }, "+ 新增分类")
      ]),
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($setup.categories, (category) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: category.id,
            class: "card"
          }, [
            vue.createElementVNode("view", { class: "line" }, [
              vue.createElementVNode("view", {
                class: "category-link",
                onClick: ($event) => $setup.goItemsByCategory(category)
              }, vue.toDisplayString(category.name), 9, ["onClick"]),
              vue.createElementVNode(
                "view",
                null,
                vue.toDisplayString($setup.countItems(category.id)) + " 项",
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "row" }, [
              vue.createElementVNode("button", {
                class: "action-btn",
                onClick: ($event) => $setup.handleRename(category.id)
              }, "重命名", 8, ["onClick"]),
              vue.createElementVNode("button", {
                class: "action-btn",
                onClick: ($event) => $setup.handleMigrate(category.id)
              }, "迁移到其他分类", 8, ["onClick"]),
              vue.createElementVNode("button", {
                class: "action-btn danger-btn",
                onClick: ($event) => $setup.handleDelete(category.id)
              }, "删除", 8, ["onClick"])
            ])
          ]);
        }),
        128
        /* KEYED_FRAGMENT */
      )),
      vue.createVNode($setup["AppModal"], {
        visible: $setup.renameModalVisible,
        "onUpdate:visible": _cache[1] || (_cache[1] = ($event) => $setup.renameModalVisible = $event),
        title: "重命名",
        showInput: true,
        "input-placeholder": "输入新名称",
        "initial-input": $setup.renameInitialName,
        onConfirm: $setup.confirmRename
      }, null, 8, ["visible", "initial-input"])
    ]);
  }
  const PagesCategoriesIndex = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__scopeId", "data-v-ae523c2b"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/pages/categories/index.vue"]]);
  const _sfc_main$6 = /* @__PURE__ */ vue.defineComponent({
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const reminders = vue.ref([]);
      const addReminderModalVisible = vue.ref(false);
      const editReminderModalVisible = vue.ref(false);
      const editingReminderId = vue.ref("");
      const addForm = vue.reactive({
        title: "",
        note: "",
        dueDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
      });
      const editForm = vue.reactive({
        title: "",
        note: "",
        dueDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
      });
      onLoad((query) => {
        if ((query == null ? void 0 : query.create) === "1") {
          addReminderModalVisible.value = true;
        }
      });
      onShow(() => {
        refresh();
      });
      function refresh() {
        reminders.value = listReminders();
      }
      function handleComplete(id) {
        completeReminder(id);
        uni.showToast({ title: "已完成", icon: "success" });
        refresh();
      }
      function handleEdit(item) {
        editingReminderId.value = item.id;
        editForm.title = item.title;
        editForm.note = item.note || "";
        editForm.dueDate = item.dueDate;
        editReminderModalVisible.value = true;
      }
      function handleCompleteAll() {
        completeAllReminders();
        uni.showToast({ title: "全部已完成", icon: "success" });
        refresh();
      }
      function handleClearAll() {
        uni.showModal({
          title: "确认清空",
          content: "将删除所有提醒，且不可恢复",
          confirmColor: "#cf2f33",
          success: (res) => {
            if (!res.confirm) {
              return;
            }
            clearAllReminders();
            uni.showToast({ title: "已清空", icon: "success" });
            refresh();
          }
        });
      }
      function handleDelete(id) {
        uni.showModal({
          title: "删除提醒",
          content: "确认删除这条提醒吗？",
          confirmColor: "#cf2f33",
          success: (res) => {
            if (!res.confirm) {
              return;
            }
            deleteReminder(id);
            uni.showToast({ title: "已删除", icon: "success" });
            refresh();
          }
        });
      }
      function openAddReminder() {
        addForm.title = "";
        addForm.note = "";
        addForm.dueDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        addReminderModalVisible.value = true;
      }
      function confirmAddReminder() {
        const title = addForm.title.trim();
        if (!title) {
          uni.showToast({ title: "请输入提醒标题", icon: "none" });
          return;
        }
        createCustomReminder({ title, note: addForm.note, dueDate: addForm.dueDate });
        uni.showToast({ title: "提醒已新增", icon: "success" });
        addReminderModalVisible.value = false;
        refresh();
      }
      function onDateChange(e) {
        addForm.dueDate = e.detail.value;
      }
      function onEditDateChange(e) {
        editForm.dueDate = e.detail.value;
      }
      function confirmEditReminder() {
        const title = editForm.title.trim();
        if (!editingReminderId.value) {
          return;
        }
        if (!title) {
          uni.showToast({ title: "请输入提醒标题", icon: "none" });
          return;
        }
        try {
          updateReminder(editingReminderId.value, {
            title,
            note: editForm.note,
            dueDate: editForm.dueDate
          });
          uni.showToast({ title: "已保存", icon: "success" });
          editReminderModalVisible.value = false;
          refresh();
        } catch (err) {
          uni.showToast({ title: err.message, icon: "none" });
        }
      }
      function reminderNote(item) {
        if (item.note && item.note.trim()) {
          return item.note;
        }
        if (item.type === "high_daily_cost") {
          return "日均成本提醒";
        }
        if (item.type === "idle_check") {
          return "闲置检查提醒";
        }
        return "自定义提醒";
      }
      function displayDate(dateStr) {
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime()))
          return dateStr;
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
      function leftDaysText(dateStr) {
        const due = new Date(dateStr).getTime();
        if (!Number.isFinite(due))
          return "日期异常";
        const left = Math.ceil((due - Date.now()) / (1e3 * 60 * 60 * 24));
        if (left > 0)
          return `剩余 ${left} 天`;
        if (left === 0)
          return "今天到期";
        return `已逾期 ${Math.abs(left)} 天`;
      }
      const __returned__ = { reminders, addReminderModalVisible, editReminderModalVisible, editingReminderId, addForm, editForm, refresh, handleComplete, handleEdit, handleCompleteAll, handleClearAll, handleDelete, openAddReminder, confirmAddReminder, onDateChange, onEditDateChange, confirmEditReminder, reminderNote, displayDate, leftDaysText };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-wrap" }, [
      vue.createElementVNode("view", null, [
        vue.createElementVNode("view", { class: "page-title" }, "提醒中心"),
        vue.createElementVNode("view", { class: "page-subtitle" }, "集中处理提醒")
      ]),
      vue.createElementVNode("view", { class: "card action-block" }, [
        vue.createElementVNode("view", { class: "action-top-row" }, [
          vue.createElementVNode("button", {
            class: "soft-btn add-btn",
            onClick: $setup.openAddReminder
          }, "+ 新增提醒"),
          vue.createElementVNode("button", {
            class: "primary-btn bulk-btn",
            onClick: $setup.handleCompleteAll
          }, "✓ 一键完成全部提醒")
        ])
      ]),
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($setup.reminders, (item) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: item.id,
            class: "card reminder-card"
          }, [
            vue.createElementVNode("view", {
              class: "mini-delete",
              onClick: ($event) => $setup.handleDelete(item.id)
            }, "🗑", 8, ["onClick"]),
            vue.createElementVNode("view", { class: "title-row" }, [
              vue.createElementVNode("view", { class: "title-block" }, [
                vue.createElementVNode(
                  "view",
                  { class: "title" },
                  vue.toDisplayString(item.title),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  { class: "title-extra" },
                  vue.toDisplayString($setup.reminderNote(item)),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "right-meta" }, [
                vue.createElementVNode(
                  "view",
                  { class: "due-date" },
                  vue.toDisplayString($setup.displayDate(item.dueDate)),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  { class: "left-days" },
                  vue.toDisplayString($setup.leftDaysText(item.dueDate)),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["status", item.status === "pending" ? "pending" : "done"])
                  },
                  vue.toDisplayString(item.status === "pending" ? "待处理" : "已完成"),
                  3
                  /* TEXT, CLASS */
                )
              ])
            ]),
            vue.createElementVNode("view", { class: "row" }, [
              vue.createElementVNode("button", {
                class: "action-btn delay-btn",
                onClick: ($event) => $setup.handleEdit(item)
              }, "编辑", 8, ["onClick"]),
              vue.createElementVNode("button", {
                class: "action-btn complete-btn",
                onClick: ($event) => $setup.handleComplete(item.id)
              }, "完成", 8, ["onClick"])
            ])
          ]);
        }),
        128
        /* KEYED_FRAGMENT */
      )),
      $setup.reminders.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "card empty"
      }, "暂无提醒")) : vue.createCommentVNode("v-if", true),
      $setup.reminders.length > 0 ? (vue.openBlock(), vue.createElementBlock("button", {
        key: 1,
        class: "danger-btn clear-all-btn",
        onClick: $setup.handleClearAll
      }, "一键清空所有提醒")) : vue.createCommentVNode("v-if", true),
      $setup.addReminderModalVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "modal-mask",
        onClick: _cache[0] || (_cache[0] = ($event) => $setup.addReminderModalVisible = false)
      })) : vue.createCommentVNode("v-if", true),
      $setup.addReminderModalVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "modal-panel"
      }, [
        vue.createElementVNode("view", { class: "modal-title" }, "新增提醒"),
        vue.createElementVNode("view", { class: "field-label" }, "提醒标题"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.addForm.title = $event),
            class: "field-input",
            placeholder: "输入提醒标题"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.addForm.title]
        ]),
        vue.createElementVNode("view", { class: "field-label" }, "备注"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.addForm.note = $event),
            class: "field-input",
            placeholder: "输入备注（小字显示）"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.addForm.note]
        ]),
        vue.createElementVNode("view", { class: "field-label" }, "日期"),
        vue.createElementVNode("picker", {
          mode: "date",
          value: $setup.addForm.dueDate,
          start: "2000-01-01",
          end: "2099-12-31",
          onChange: $setup.onDateChange
        }, [
          vue.createElementVNode(
            "view",
            { class: "field-input date-field" },
            vue.toDisplayString($setup.addForm.dueDate),
            1
            /* TEXT */
          )
        ], 40, ["value"]),
        vue.createElementVNode("view", { class: "modal-actions" }, [
          vue.createElementVNode("button", {
            class: "modal-btn cancel-btn",
            onClick: _cache[3] || (_cache[3] = ($event) => $setup.addReminderModalVisible = false)
          }, "取消"),
          vue.createElementVNode("button", {
            class: "modal-btn confirm-btn",
            onClick: $setup.confirmAddReminder
          }, "确定")
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.editReminderModalVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 4,
        class: "modal-mask",
        onClick: _cache[4] || (_cache[4] = ($event) => $setup.editReminderModalVisible = false)
      })) : vue.createCommentVNode("v-if", true),
      $setup.editReminderModalVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 5,
        class: "modal-panel"
      }, [
        vue.createElementVNode("view", { class: "modal-title" }, "编辑提醒"),
        vue.createElementVNode("view", { class: "field-label" }, "提醒标题"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $setup.editForm.title = $event),
            class: "field-input",
            placeholder: "输入提醒标题"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.editForm.title]
        ]),
        vue.createElementVNode("view", { class: "field-label" }, "备注"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $setup.editForm.note = $event),
            class: "field-input",
            placeholder: "输入备注（小字显示）"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.editForm.note]
        ]),
        vue.createElementVNode("view", { class: "field-label" }, "日期"),
        vue.createElementVNode("picker", {
          mode: "date",
          value: $setup.editForm.dueDate,
          start: "2000-01-01",
          end: "2099-12-31",
          onChange: $setup.onEditDateChange
        }, [
          vue.createElementVNode(
            "view",
            { class: "field-input date-field" },
            vue.toDisplayString($setup.editForm.dueDate),
            1
            /* TEXT */
          )
        ], 40, ["value"]),
        vue.createElementVNode("view", { class: "modal-actions" }, [
          vue.createElementVNode("button", {
            class: "modal-btn cancel-btn",
            onClick: _cache[7] || (_cache[7] = ($event) => $setup.editReminderModalVisible = false)
          }, "取消"),
          vue.createElementVNode("button", {
            class: "modal-btn confirm-btn",
            onClick: $setup.confirmEditReminder
          }, "保存")
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesRemindersIndex = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__scopeId", "data-v-f772585b"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/pages/reminders/index.vue"]]);
  const DAY_WINDOW = 7;
  const DAY_LOOKBACK = 365;
  const _sfc_main$5 = /* @__PURE__ */ vue.defineComponent({
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const summary = vue.reactive(getAnalyticsSummary());
      const trendData = vue.ref([]);
      const granularity = vue.ref("month");
      const showGranularityBar = vue.ref(false);
      const dayOffset = vue.ref(0);
      const granularityLabel = {
        day: "按日",
        month: "按月",
        year: "按年"
      };
      const granularityOptions = [
        { value: "day", label: "按日" },
        { value: "month", label: "按月" },
        { value: "year", label: "按年" }
      ];
      const byCategoryPercent = vue.computed(() => {
        const total = summary.byCategory.reduce((sum, item) => sum + item.count, 0) || 1;
        return summary.byCategory.map((item) => ({
          name: item.name,
          percent: Math.round(item.count / total * 100)
        }));
      });
      const dayMaxOffset = vue.computed(() => Math.max(0, DAY_LOOKBACK - DAY_WINDOW));
      onShow(() => {
        Object.assign(summary, getAnalyticsSummary());
        refreshTrend();
      });
      function refreshTrend() {
        const keys = buildRecentKeys(granularity.value);
        const amountMap = keys.reduce((map, key) => {
          map[key] = 0;
          return map;
        }, {});
        listItems({ sortBy: "purchaseDate" }).forEach((item) => {
          const date = parseDateForTrend(item.purchaseDate || item.createdAt);
          if (Number.isNaN(date.getTime())) {
            return;
          }
          const key = getKeyByGranularity(date, granularity.value);
          if (key in amountMap) {
            amountMap[key] += Number(item.price) || 0;
          }
        });
        const max = Math.max(...Object.values(amountMap), 1);
        trendData.value = keys.map((key) => {
          const amount = amountMap[key];
          return {
            key,
            label: keyToLabel(key, granularity.value),
            amount,
            height: amount === 0 ? 0 : Math.max(52, Math.round(amount / max * 148))
          };
        });
      }
      function toggleGranularity() {
        showGranularityBar.value = !showGranularityBar.value;
      }
      function selectGranularity(value) {
        granularity.value = value;
        showGranularityBar.value = false;
        refreshTrend();
      }
      function onDayOffsetChange(e) {
        const raw = Number(e.detail.value) || 0;
        dayOffset.value = Math.max(0, Math.min(dayMaxOffset.value, raw));
        refreshTrend();
      }
      function buildRecentKeys(mode) {
        if (mode === "day") {
          return buildRecentDayKeys(DAY_WINDOW, dayOffset.value);
        }
        if (mode === "year") {
          return buildRecentYearKeys(6);
        }
        return buildRecentMonthKeys(6);
      }
      function getKeyByGranularity(date, mode) {
        if (mode === "day") {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        }
        if (mode === "year") {
          return String(date.getFullYear());
        }
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }
      function keyToLabel(key, mode) {
        if (mode === "day") {
          const parts = key.split("-").map((item) => Number(item));
          if (parts.length < 3) {
            return key;
          }
          return `${parts[1]}/${parts[2]}`;
        }
        if (mode === "year") {
          return `${key}年`;
        }
        return `${Number(key.slice(5))}月`;
      }
      function formatAmount(value) {
        return Math.round(value).toLocaleString("zh-CN");
      }
      function buildRecentMonthKeys(size) {
        const now = /* @__PURE__ */ new Date();
        const keys = [];
        for (let i = size - 1; i >= 0; i -= 1) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }
        return keys;
      }
      function buildRecentDayKeys(size, offset = 0) {
        const now = /* @__PURE__ */ new Date();
        const keys = [];
        for (let i = size - 1; i >= 0; i -= 1) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i - offset);
          keys.push(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
          );
        }
        return keys;
      }
      function buildRecentYearKeys(size) {
        const year = (/* @__PURE__ */ new Date()).getFullYear();
        const keys = [];
        for (let i = size - 1; i >= 0; i -= 1) {
          keys.push(String(year - i));
        }
        return keys;
      }
      function parseDateForTrend(value) {
        const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
        if (dayPattern.test(value)) {
          const [year, month, day] = value.split("-").map((item) => Number(item));
          return new Date(year, month - 1, day);
        }
        return new Date(value);
      }
      const __returned__ = { summary, trendData, granularity, showGranularityBar, DAY_WINDOW, DAY_LOOKBACK, dayOffset, granularityLabel, granularityOptions, byCategoryPercent, dayMaxOffset, refreshTrend, toggleGranularity, selectGranularity, onDayOffsetChange, buildRecentKeys, getKeyByGranularity, keyToLabel, formatAmount, buildRecentMonthKeys, buildRecentDayKeys, buildRecentYearKeys, parseDateForTrend };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-wrap" }, [
      vue.createElementVNode("view", null, [
        vue.createElementVNode("view", { class: "page-title" }, "统计分析"),
        vue.createElementVNode("view", { class: "page-subtitle" }, "看清规模与成本")
      ]),
      vue.createElementVNode("view", { class: "grid" }, [
        vue.createElementVNode("view", { class: "card metric" }, [
          vue.createElementVNode("view", { class: "label" }, "总物品"),
          vue.createElementVNode(
            "view",
            { class: "value" },
            vue.toDisplayString($setup.summary.totalItems),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "card metric" }, [
          vue.createElementVNode("view", { class: "label" }, "总花费"),
          vue.createElementVNode(
            "view",
            { class: "value" },
            "¥" + vue.toDisplayString($setup.summary.totalCost),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "card metric" }, [
          vue.createElementVNode("view", { class: "label" }, "日均成本"),
          vue.createElementVNode(
            "view",
            { class: "value" },
            "¥" + vue.toDisplayString($setup.summary.avgDailyCost),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "card metric" }, [
          vue.createElementVNode("view", { class: "label" }, "闲置数量"),
          vue.createElementVNode(
            "view",
            { class: "value" },
            vue.toDisplayString($setup.summary.idleCount),
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "section-head" }, [
          vue.createElementVNode("view", { class: "section-title" }, "记录趋势"),
          vue.createElementVNode("view", { class: "section-filter" }, [
            vue.createElementVNode(
              "view",
              {
                class: "section-link",
                onClick: $setup.toggleGranularity
              },
              vue.toDisplayString($setup.granularityLabel[$setup.granularity]),
              1
              /* TEXT */
            ),
            $setup.showGranularityBar ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "granularity-bar"
            }, [
              (vue.openBlock(), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.granularityOptions, (option) => {
                  return vue.createElementVNode("view", {
                    key: option.value,
                    class: vue.normalizeClass(["granularity-item", $setup.granularity === option.value ? "granularity-item-active" : ""]),
                    onClick: ($event) => $setup.selectGranularity(option.value)
                  }, vue.toDisplayString(option.label), 11, ["onClick"]);
                }),
                64
                /* STABLE_FRAGMENT */
              ))
            ])) : vue.createCommentVNode("v-if", true)
          ])
        ]),
        vue.createElementVNode("view", { class: "trend-wrap" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.trendData, (point) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: point.key,
                class: "trend-col"
              }, [
                point.amount > 0 ? (vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 0,
                    class: "bar-amount"
                  },
                  "¥" + vue.toDisplayString($setup.formatAmount(point.amount)),
                  1
                  /* TEXT */
                )) : vue.createCommentVNode("v-if", true),
                vue.createElementVNode(
                  "view",
                  {
                    class: "trend-bar",
                    style: vue.normalizeStyle({ height: point.height + "rpx" })
                  },
                  null,
                  4
                  /* STYLE */
                ),
                vue.createElementVNode(
                  "view",
                  { class: "month" },
                  vue.toDisplayString(point.label),
                  1
                  /* TEXT */
                )
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        $setup.granularity === "day" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "day-slider-wrap"
        }, [
          vue.createElementVNode("slider", {
            class: "day-slider",
            value: $setup.dayOffset,
            min: 0,
            max: $setup.dayMaxOffset,
            step: 1,
            activeColor: "#22c55e",
            backgroundColor: "#dbe3ef",
            "block-color": "#0f172a",
            "block-size": "18",
            onChange: $setup.onDayOffsetChange
          }, null, 40, ["value", "max"])
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "section-title" }, "分类投入占比"),
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.byCategoryPercent, (item) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: item.name,
              class: "bar-item"
            }, [
              vue.createElementVNode("view", { class: "bar-head" }, [
                vue.createElementVNode(
                  "view",
                  null,
                  vue.toDisplayString(item.name),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  null,
                  vue.toDisplayString(item.percent) + "%",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "bar-track" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "bar-fill",
                    style: vue.normalizeStyle({ width: item.percent + "%" })
                  },
                  null,
                  4
                  /* STYLE */
                )
              ])
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])
    ]);
  }
  const PagesAnalyticsIndex = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-8fa57533"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/pages/analytics/index.vue"]]);
  const _sfc_main$4 = /* @__PURE__ */ vue.defineComponent({
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const importModalVisible = vue.ref(false);
      const importJson = vue.ref("");
      function handleExport() {
        const text = exportData();
        uni.setClipboardData({ data: text, success: () => uni.showToast({ title: "已复制到剪贴板", icon: "none" }) });
      }
      function openImportModal() {
        importJson.value = "";
        importModalVisible.value = true;
      }
      function closeImportModal() {
        importModalVisible.value = false;
      }
      function confirmImport() {
        const text = importJson.value.trim();
        if (!text) {
          uni.showToast({ title: "请先粘贴 JSON", icon: "none" });
          return;
        }
        try {
          const result = importDataFromJson(text);
          importModalVisible.value = false;
          uni.showToast({ title: `导入成功：${result.items} 条物品`, icon: "success" });
        } catch (err) {
          uni.showToast({ title: err.message, icon: "none" });
        }
      }
      const __returned__ = { importModalVisible, importJson, handleExport, openImportModal, closeImportModal, confirmImport };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-wrap" }, [
      vue.createElementVNode("view", null, [
        vue.createElementVNode("view", { class: "page-title" }, "数据导出"),
        vue.createElementVNode("view", { class: "page-subtitle" }, "迁移手机与本地备份")
      ]),
      vue.createElementVNode("view", { class: "card setting-card" }, [
        vue.createElementVNode("view", { class: "label" }, "数据导出（复制到剪贴板）"),
        vue.createElementVNode("view", { class: "row export-grid" }, [
          vue.createElementVNode("button", {
            class: "soft-btn panel-btn",
            onClick: $setup.handleExport
          }, "导出 JSON")
        ]),
        vue.createElementVNode("button", {
          class: "primary-btn full-btn import-btn",
          onClick: $setup.openImportModal
        }, "导入 JSON（粘贴）")
      ]),
      vue.createElementVNode("view", { class: "card tip-card" }, [
        vue.createElementVNode("view", { class: "tip-title" }, "迁移步骤"),
        vue.createElementVNode("view", { class: "tip-item" }, "1. 旧手机点击 导出 JSON 并复制"),
        vue.createElementVNode("view", { class: "tip-item" }, "2. 通过微信或网盘发送到新手机"),
        vue.createElementVNode("view", { class: "tip-item" }, "3. 新手机粘贴 JSON 后导入")
      ]),
      $setup.importModalVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "import-mask",
        onClick: $setup.closeImportModal
      })) : vue.createCommentVNode("v-if", true),
      $setup.importModalVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "import-panel"
      }, [
        vue.createElementVNode("view", { class: "import-title" }, "导入 JSON"),
        vue.createElementVNode("view", { class: "import-desc" }, "粘贴从旧手机导出的 JSON 内容，导入后将覆盖本地数据。"),
        vue.withDirectives(vue.createElementVNode(
          "textarea",
          {
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.importJson = $event),
            class: "import-textarea",
            placeholder: "请粘贴完整 JSON",
            maxlength: -1
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.importJson]
        ]),
        vue.createElementVNode("view", { class: "import-actions" }, [
          vue.createElementVNode("button", {
            class: "soft-btn panel-btn",
            onClick: $setup.closeImportModal
          }, "取消"),
          vue.createElementVNode("button", {
            class: "danger-btn panel-btn",
            onClick: $setup.confirmImport
          }, "导入并覆盖")
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesDataExportIndex = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-65221f96"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/pages/data-export/index.vue"]]);
  const _sfc_main$3 = /* @__PURE__ */ vue.defineComponent({
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const settings = vue.reactive({
        dailyCostThreshold: 5,
        idleThresholdDays: 60,
        defaultReminderTime: "09:00"
      });
      const mode = vue.ref("light");
      const resetModalVisible = vue.ref(false);
      onShow(() => {
        Object.assign(settings, getSettings());
        mode.value = getThemeMode();
      });
      function handleSave() {
        if (!Number.isFinite(settings.dailyCostThreshold) || settings.dailyCostThreshold <= 0) {
          uni.showToast({ title: "高日均阈值需大于 0", icon: "none" });
          return;
        }
        if (!Number.isFinite(settings.idleThresholdDays) || settings.idleThresholdDays < 1) {
          uni.showToast({ title: "闲置阈值至少为 1 天", icon: "none" });
          return;
        }
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(settings.defaultReminderTime)) {
          uni.showToast({ title: "提醒时间格式应为 HH:mm", icon: "none" });
          return;
        }
        const next = updateSettings(settings);
        Object.assign(settings, next);
        uni.showToast({ title: "设置已保存", icon: "success" });
      }
      function handleReset() {
        resetModalVisible.value = true;
      }
      function confirmReset() {
        resetDemoData();
        Object.assign(settings, getSettings());
        uni.showToast({ title: "已恢复", icon: "success" });
      }
      function setMode(value) {
        setThemeMode(value);
        mode.value = value;
        uni.showToast({ title: `已切换${value === "dark" ? "深色" : "浅色"}模式`, icon: "none" });
      }
      const __returned__ = { settings, mode, resetModalVisible, handleSave, handleReset, confirmReset, setMode, AppModal };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-wrap" }, [
      vue.createElementVNode("view", null, [
        vue.createElementVNode("view", { class: "page-title" }, "设置"),
        vue.createElementVNode("view", { class: "page-subtitle" }, "管理阈值与数据")
      ]),
      vue.createElementVNode("view", { class: "card setting-card" }, [
        vue.createElementVNode("view", { class: "label" }, "高日均阈值（元/天）"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.settings.dailyCostThreshold = $event),
            class: "input",
            type: "digit"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [
            vue.vModelText,
            $setup.settings.dailyCostThreshold,
            void 0,
            { number: true }
          ]
        ]),
        vue.createElementVNode("view", { class: "label" }, "闲置阈值（天）"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.settings.idleThresholdDays = $event),
            class: "input",
            type: "number"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [
            vue.vModelText,
            $setup.settings.idleThresholdDays,
            void 0,
            { number: true }
          ]
        ]),
        vue.createElementVNode("view", { class: "label" }, "默认提醒时间"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.settings.defaultReminderTime = $event),
            class: "input",
            placeholder: "09:00"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.settings.defaultReminderTime]
        ]),
        vue.createElementVNode("button", {
          class: "primary-btn full-btn",
          onClick: $setup.handleSave
        }, "保存设置")
      ]),
      vue.createElementVNode("view", { class: "card setting-card" }, [
        vue.createElementVNode("view", { class: "label" }, "主题模式"),
        vue.createElementVNode("view", { class: "row theme-grid" }, [
          vue.createElementVNode(
            "button",
            {
              class: vue.normalizeClass(["panel-btn", $setup.mode === "light" ? "primary-btn" : "soft-btn"]),
              onClick: _cache[3] || (_cache[3] = ($event) => $setup.setMode("light"))
            },
            "浅色",
            2
            /* CLASS */
          ),
          vue.createElementVNode(
            "button",
            {
              class: vue.normalizeClass(["panel-btn", $setup.mode === "dark" ? "primary-btn" : "soft-btn"]),
              onClick: _cache[4] || (_cache[4] = ($event) => $setup.setMode("dark"))
            },
            "深色",
            2
            /* CLASS */
          )
        ])
      ]),
      vue.createElementVNode("view", { class: "card setting-card danger-wrap" }, [
        vue.createElementVNode("button", {
          class: "danger-btn full-btn",
          onClick: $setup.handleReset
        }, "恢复演示数据")
      ]),
      vue.createVNode($setup["AppModal"], {
        visible: $setup.resetModalVisible,
        "onUpdate:visible": _cache[5] || (_cache[5] = ($event) => $setup.resetModalVisible = $event),
        title: "确认恢复",
        message: "将覆盖当前本地数据",
        dangerConfirm: true,
        "confirm-text": "恢复",
        onConfirm: $setup.confirmReset
      }, null, 8, ["visible"])
    ]);
  }
  const PagesSettingsIndex = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-b4180827"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/pages/settings/index.vue"]]);
  const _sfc_main$2 = /* @__PURE__ */ vue.defineComponent({
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const stats = vue.reactive({
        totalItems: 0,
        totalReminders: 0,
        exportCount: 0
      });
      onShow(() => {
        Object.assign(stats, getProfileSummary());
      });
      function go(url) {
        uni.navigateTo({ url });
      }
      function logout() {
        uni.switchTab({ url: "/pages/dashboard/index" });
      }
      const __returned__ = { stats, go, logout };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-wrap" }, [
      vue.createElementVNode("view", { class: "card profile-card" }, [
        vue.createElementVNode("view", { class: "profile-row" }, [
          vue.createElementVNode("view", { class: "avatar" }, "🗂️"),
          vue.createElementVNode("view", null, [
            vue.createElementVNode("view", { class: "page-title" }, "我的"),
            vue.createElementVNode("view", { class: "page-subtitle" }, "本地优先，长期可用")
          ])
        ]),
        vue.createElementVNode("view", { class: "stats-grid" }, [
          vue.createElementVNode("view", { class: "soft-block stat-item" }, [
            vue.createElementVNode(
              "view",
              { class: "stat-value" },
              vue.toDisplayString($setup.stats.totalItems),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "stat-label" }, "总物品")
          ]),
          vue.createElementVNode("view", { class: "soft-block stat-item" }, [
            vue.createElementVNode(
              "view",
              { class: "stat-value" },
              vue.toDisplayString($setup.stats.totalReminders),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "stat-label" }, "累计提醒")
          ]),
          vue.createElementVNode("view", { class: "soft-block stat-item" }, [
            vue.createElementVNode(
              "view",
              { class: "stat-value" },
              vue.toDisplayString($setup.stats.exportCount),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "stat-label" }, "导出次数")
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "action-list" }, [
        vue.createElementVNode("view", {
          class: "card action-item",
          onClick: _cache[0] || (_cache[0] = ($event) => $setup.go("/pages/categories/index"))
        }, [
          vue.createElementVNode("view", null, [
            vue.createElementVNode("view", { class: "action-title" }, "分类管理"),
            vue.createElementVNode("view", { class: "action-sub" }, "管理分类与迁移")
          ]),
          vue.createElementVNode("view", { class: "arrow" }, "›")
        ]),
        vue.createElementVNode("view", {
          class: "card action-item",
          onClick: _cache[1] || (_cache[1] = ($event) => $setup.go("/pages/reminders/index"))
        }, [
          vue.createElementVNode("view", null, [
            vue.createElementVNode("view", { class: "action-title" }, "提醒中心"),
            vue.createElementVNode("view", { class: "action-sub" }, "管理提醒与预警")
          ]),
          vue.createElementVNode("view", { class: "arrow" }, "›")
        ]),
        vue.createElementVNode("view", {
          class: "card action-item",
          onClick: _cache[2] || (_cache[2] = ($event) => $setup.go("/pages/settings/index"))
        }, [
          vue.createElementVNode("view", null, [
            vue.createElementVNode("view", { class: "action-title" }, "设置"),
            vue.createElementVNode("view", { class: "action-sub" }, "阈值、主题、恢复")
          ]),
          vue.createElementVNode("view", { class: "arrow" }, "›")
        ]),
        vue.createElementVNode("view", {
          class: "card action-item",
          onClick: _cache[3] || (_cache[3] = ($event) => $setup.go("/pages/data-export/index"))
        }, [
          vue.createElementVNode("view", null, [
            vue.createElementVNode("view", { class: "action-title" }, "数据导出"),
            vue.createElementVNode("view", { class: "action-sub" }, "导出 / 导入 JSON")
          ]),
          vue.createElementVNode("view", { class: "arrow" }, "›")
        ])
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "section-title" }, "存储与同步说明"),
        vue.createElementVNode("view", { class: "tips" }, [
          vue.createElementVNode("view", { class: "soft-block tip-item" }, "当前版本默认本地存储，不依赖云端登录能力。"),
          vue.createElementVNode("view", { class: "soft-block tip-item" }, "支持导出 JSON / CSV 用于备份或迁移。"),
          vue.createElementVNode("view", { class: "soft-block tip-item" }, "后续可平滑扩展局域网或 NAS 备份。")
        ])
      ]),
      vue.createElementVNode("button", {
        class: "danger-btn logout-btn",
        onClick: $setup.logout
      }, "返回首页")
    ]);
  }
  const PagesMeIndex = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-b21a492e"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/pages/me/index.vue"]]);
  const ONBOARDING_DONE_KEY$1 = "writedown_onboarding_done";
  const ONBOARDING_STATUS_DONE = "done";
  const _sfc_main$1 = /* @__PURE__ */ vue.defineComponent({
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      vue.onMounted(() => {
        if (uni.getStorageSync(ONBOARDING_DONE_KEY$1) === ONBOARDING_STATUS_DONE) {
          uni.switchTab({ url: "/pages/dashboard/index" });
        }
      });
      function markDone() {
        uni.setStorageSync(ONBOARDING_DONE_KEY$1, ONBOARDING_STATUS_DONE);
      }
      function skip() {
        markDone();
        uni.switchTab({ url: "/pages/dashboard/index" });
      }
      function startNow() {
        markDone();
        uni.switchTab({ url: "/pages/dashboard/index" });
      }
      const __returned__ = { ONBOARDING_DONE_KEY: ONBOARDING_DONE_KEY$1, ONBOARDING_STATUS_DONE, markDone, skip, startNow };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "onboarding-wrap" }, [
      vue.createElementVNode("view", { class: "mesh-orb orb-a" }),
      vue.createElementVNode("view", { class: "mesh-orb orb-b" }),
      vue.createElementVNode("view", { class: "hero card-float" }, [
        vue.createElementVNode("view", { class: "hero-topline" }, "WRITE DOWN, OWN LESS CHAOS"),
        vue.createElementVNode("view", { class: "hero-title" }, "物记"),
        vue.createElementVNode("view", { class: "hero-sub" }, "一款强调本地优先、轻量清晰的个人物品管理应用"),
        vue.createElementVNode("view", { class: "hero-chips" }, [
          vue.createElementVNode("view", { class: "hero-chip" }, "本地优先"),
          vue.createElementVNode("view", { class: "hero-chip" }, "离线可用"),
          vue.createElementVNode("view", { class: "hero-chip" }, "快速导出")
        ])
      ]),
      vue.createElementVNode("view", { class: "card feature-list card-float delay-1" }, [
        vue.createElementVNode("view", { class: "feature-item" }, [
          vue.createElementVNode("view", { class: "feature-emoji" }, "📦"),
          vue.createElementVNode("view", { class: "feature-main" }, [
            vue.createElementVNode("view", { class: "feature-title" }, "快速记录物品"),
            vue.createElementVNode("view", { class: "feature-sub" }, "分类、价格、购入时间、状态统一管理")
          ])
        ]),
        vue.createElementVNode("view", { class: "feature-item" }, [
          vue.createElementVNode("view", { class: "feature-emoji" }, "🔔"),
          vue.createElementVNode("view", { class: "feature-main" }, [
            vue.createElementVNode("view", { class: "feature-title" }, "到期提醒与闲置预警"),
            vue.createElementVNode("view", { class: "feature-sub" }, "自动汇总提醒，减少遗忘与重复购买")
          ])
        ]),
        vue.createElementVNode("view", { class: "feature-item" }, [
          vue.createElementVNode("view", { class: "feature-emoji" }, "🧾"),
          vue.createElementVNode("view", { class: "feature-main" }, [
            vue.createElementVNode("view", { class: "feature-title" }, "数据可控且可迁移"),
            vue.createElementVNode("view", { class: "feature-sub" }, "支持 JSON / CSV 导出，备份与换机都更稳")
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "trust-row card-float delay-2" }, [
        vue.createElementVNode("view", { class: "trust-item" }, [
          vue.createElementVNode("view", { class: "trust-value" }, "100%"),
          vue.createElementVNode("view", { class: "trust-label" }, "本地存储")
        ]),
        vue.createElementVNode("view", { class: "trust-item" }, [
          vue.createElementVNode("view", { class: "trust-value" }, "0"),
          vue.createElementVNode("view", { class: "trust-label" }, "强制登录")
        ]),
        vue.createElementVNode("view", { class: "trust-item" }, [
          vue.createElementVNode("view", { class: "trust-value" }, "2 步"),
          vue.createElementVNode("view", { class: "trust-label" }, "即可上手")
        ])
      ]),
      vue.createElementVNode("view", { class: "action-row card-float delay-3" }, [
        vue.createElementVNode("button", {
          class: "ghost-btn",
          onClick: $setup.skip
        }, "稍后查看"),
        vue.createElementVNode("button", {
          class: "start-btn",
          onClick: $setup.startNow
        }, "开始使用")
      ])
    ]);
  }
  const PagesOnboardingIndex = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-5677305c"], ["__file", "C:/Users/FLYFISH/Desktop/test3/src/pages/onboarding/index.vue"]]);
  __definePage("pages/dashboard/index", PagesDashboardIndex);
  __definePage("pages/items/index", PagesItemsIndex);
  __definePage("pages/add/index", PagesAddIndex);
  __definePage("pages/items/detail", PagesItemsDetail);
  __definePage("pages/items/edit", PagesItemsEdit);
  __definePage("pages/categories/index", PagesCategoriesIndex);
  __definePage("pages/reminders/index", PagesRemindersIndex);
  __definePage("pages/analytics/index", PagesAnalyticsIndex);
  __definePage("pages/data-export/index", PagesDataExportIndex);
  __definePage("pages/settings/index", PagesSettingsIndex);
  __definePage("pages/me/index", PagesMeIndex);
  __definePage("pages/onboarding/index", PagesOnboardingIndex);
  const ONBOARDING_DONE_KEY = "writedown_onboarding_done";
  const ONBOARDING_STATUS_SHOWN = "shown";
  const _sfc_main = {
    onLaunch() {
      const onboardingStatus = uni.getStorageSync(ONBOARDING_DONE_KEY);
      if (!onboardingStatus) {
        uni.setStorageSync(ONBOARDING_DONE_KEY, ONBOARDING_STATUS_SHOWN);
      }
    },
    onShow() {
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "C:/Users/FLYFISH/Desktop/test3/src/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
