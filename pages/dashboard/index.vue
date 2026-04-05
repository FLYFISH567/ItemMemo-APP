<template>
  <view class="page-wrap">
    <view class="header-row">
      <view>
        <view class="page-subtitle">一眼看清物品状态</view>
        <view class="page-title">首页总览</view>
      </view>
      <view class="header-actions">
        <view class="icon-btn" @click="go('/pages/items/index')">🔍</view>
        <view class="icon-btn" @click="go('/pages/reminders/index')">🔔</view>
        <view class="icon-btn" @click="handleToggleTheme">{{ darkMode ? '☀️' : '🌙' }}</view>
      </view>
    </view>

    <view class="gradient-banner">
      <view class="banner-title">当前物品资产概览</view>
      <view class="banner-main">{{ summary.totalItems }} 件</view>
      <view class="banner-sub">累计投入 ¥{{ summary.totalCost }}</view>
      <view class="banner-grid">
        <view class="banner-chip">
          <view class="chip-label">待提醒</view>
          <view class="chip-value">{{ summary.pendingReminders }}</view>
        </view>
        <view class="banner-chip">
          <view class="chip-label">本月新增</view>
          <view class="chip-value">{{ summary.newItemsThisMonth }}</view>
        </view>
        <view class="banner-chip">
          <view class="chip-label">日均成本</view>
          <view class="chip-value">¥{{ summary.avgDailyCost }}</view>
        </view>
      </view>
    </view>

    <view class="quick-grid">
      <view v-for="entry in quickEntries" :key="entry.label" class="card quick-item" @click="go(entry.url)">
        <view class="soft-block quick-icon">{{ entry.icon }}</view>
        <view class="quick-label">{{ entry.label }}</view>
      </view>
    </view>

    <view>
      <view class="section-head">
        <view class="section-title">即将到期提醒</view>
        <view class="section-link" @click="go('/pages/reminders/index')">查看全部</view>
      </view>
      <view class="reminder-list">
        <view v-for="reminder in reminders" :key="reminder.id" class="card reminder-item" @click="go('/pages/reminders/index')">
          <view>
            <view class="item-title">{{ reminder.title }}</view>
            <view class="item-sub">{{ reminder.note }}</view>
          </view>
          <view class="align-right">
            <view class="item-title">{{ reminder.date }}</view>
            <view class="item-sub">{{ reminder.leftText }}</view>
          </view>
        </view>
        <view v-if="!reminders.length" class="card empty-reminder">暂无待处理提醒</view>
      </view>
    </view>

    <view>
      <view class="section-head">
        <view class="section-title">最新记录</view>
        <view class="section-link" @click="go('/pages/items/index')">进入列表</view>
      </view>
      <view class="recent-list">
        <view v-for="item in recentItems" :key="item.id" class="card recent-item" @click="goDetail(item.id)">
          <view class="soft-block emoji">{{ item.icon || '📦' }}</view>
          <view class="recent-main">
            <view class="line-top">
              <view class="item-title">{{ item.name }}</view>
              <view :class="['status-tag', item.status === 'active' ? 'ok' : item.status === 'idle' ? 'warn' : 'arch']">
                {{ item.status === "active" ? "使用中" : item.status === "idle" ? "闲置中" : "已弃用" }}
              </view>
            </view>
            <view class="item-sub">{{ categoryName(item.categoryId) }} · 已持有 {{ getItemExtra(item).holdDays }} 天</view>
            <view class="item-title">日均成本 ¥{{ getItemExtra(item).dailyCost }}</view>
          </view>
        </view>
      </view>
    </view>

    <button class="all-btn" @click="go('/pages/items/index')">查看全部物品</button>
  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, reactive, ref } from "vue";
import { getDashboardSummary, getItemExtra, listCategories, listItems, listReminders } from "@/services/appService";
import { requireAuth } from "@/utils/auth";
import { isDarkTheme, toggleThemeMode } from "@/utils/theme";
import type { Item, Reminder } from "@/types";

const summary = reactive({
  totalItems: 0,
  totalCost: 0,
  pendingReminders: 0,
  avgDailyCost: 0,
  newItemsThisMonth: 0,
});
const categories = ref(listCategories());
const recentItems = ref<Item[]>([]);
const darkMode = ref(isDarkTheme());
const reminders = ref<Array<{ id: string; title: string; note: string; date: string; leftText: string }>>([]);

const quickEntries = computed(() => [
  { label: "新增物品", icon: "➕", url: "/pages/add/index" },
  { label: "提醒", icon: "🔔", url: "/pages/reminders/index" },
  { label: "统计", icon: "📊", url: "/pages/analytics/index" },
  { label: "导出", icon: "⬇️", url: "/pages/data-export/index" },
]);

onShow(() => {
  if (!requireAuth()) {
    return;
  }
  const data = getDashboardSummary();
  Object.assign(summary, data);
  categories.value = listCategories();
  recentItems.value = listItems({ sortBy: "updatedAt" }).slice(0, 3);
  refreshReminders();
  darkMode.value = isDarkTheme();
});

function refreshReminders() {
  reminders.value = listReminders()
    .filter((item) => item.status === "pending")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      title: item.title,
      note: item.note || reminderFallbackNote(item),
      date: formatDueDate(item.dueDate),
      leftText: dueLeftText(item.dueDate),
    }));
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function dueLeftText(dateStr: string): string {
  const due = new Date(dateStr).getTime();
  if (!Number.isFinite(due)) return "日期异常";
  const days = Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24));
  if (days > 0) return `剩余 ${days} 天`;
  if (days === 0) return "今天到期";
  return `已逾期 ${Math.abs(days)} 天`;
}

function reminderFallbackNote(item: Reminder): string {
  if (item.type === "high_daily_cost") return "日均成本提醒";
  if (item.type === "idle_check") return "闲置检查提醒";
  return "提醒通知";
}

function go(url: string) {
  if (
    url === "/pages/dashboard/index" ||
    url === "/pages/items/index" ||
    url === "/pages/add/index" ||
    url === "/pages/analytics/index" ||
    url === "/pages/me/index"
  ) {
    uni.switchTab({ url });
    return;
  }
  uni.navigateTo({ url });
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/items/detail?id=${id}` });
}

function categoryName(id: string): string {
  return categories.value.find((it) => it.id === id)?.name || "未分类";
}

function handleToggleTheme() {
  darkMode.value = toggleThemeMode() === "dark";
}
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12rpx;
}

.icon-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-title {
  font-size: 26rpx;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
}

.banner-main {
  margin-top: 10rpx;
  font-size: 48rpx;
  font-weight: 700;
}

.banner-sub {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.82);
}

.banner-grid {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.banner-chip {
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.18);
  padding: 14rpx;
}

.chip-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.72);
}

.chip-value {
  margin-top: 4rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
}

.quick-item {
  text-align: center;
  padding: 18rpx 10rpx;
}

.quick-icon {
  width: 74rpx;
  height: 74rpx;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-label {
  margin-top: 10rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-link {
  color: #64748b;
  font-size: 24rpx;
}

.empty-reminder {
  text-align: center;
  color: #6f7891;
}

.reminder-list,
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.reminder-item,
.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.align-right {
  text-align: right;
}

.item-title {
  font-size: 30rpx;
  font-weight: 600;
}

.item-sub {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 24rpx;
}

.emoji {
  width: 84rpx;
  height: 84rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.recent-main {
  flex: 1;
  margin-left: 12rpx;
}

.line-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-tag {
  border-radius: 999rpx;
  padding: 4rpx 12rpx;
  font-size: 20rpx;
}

.ok {
  background: #dcfce7;
  color: #166534;
}

.warn {
  background: #fef3c7;
  color: #92400e;
}

.arch {
  background: #e2e8f0;
  color: #334155;
}

.all-btn {
  width: 100%;
  background: #ffffff;
  color: #0f172a;
  border: 1px solid rgba(15, 23, 42, 0.08);
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  border-radius: 999rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
