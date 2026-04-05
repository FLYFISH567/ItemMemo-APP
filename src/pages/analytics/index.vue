<template>
  <view class="page-wrap">
    <view>
      <view class="page-title">统计分析</view>
      <view class="page-subtitle">看清规模与成本</view>
    </view>

    <view class="grid">
      <view class="card metric">
        <view class="label">总物品</view>
        <view class="value">{{ summary.totalItems }}</view>
      </view>
      <view class="card metric">
        <view class="label">总花费</view>
        <view class="value">¥{{ summary.totalCost }}</view>
      </view>
      <view class="card metric">
        <view class="label">日均成本</view>
        <view class="value">¥{{ summary.avgDailyCost }}</view>
      </view>
      <view class="card metric">
        <view class="label">闲置数量</view>
        <view class="value">{{ summary.idleCount }}</view>
      </view>
    </view>

    <view class="card">
      <view class="section-head">
        <view class="section-title">记录趋势</view>
        <view class="section-filter">
          <view class="section-link" @click="toggleGranularity">{{ granularityLabel[granularity] }}</view>
          <view v-if="showGranularityBar" class="granularity-bar">
            <view
              v-for="option in granularityOptions"
              :key="option.value"
              :class="['granularity-item', granularity === option.value ? 'granularity-item-active' : '']"
              @click="selectGranularity(option.value)"
            >
              {{ option.label }}
            </view>
          </view>
        </view>
      </view>
      <view class="trend-wrap">
        <view v-for="point in trendData" :key="point.key" class="trend-col">
          <view v-if="point.amount > 0" class="bar-amount">¥{{ formatAmount(point.amount) }}</view>
          <view class="trend-bar" :style="{ height: point.height + 'rpx' }"></view>
          <view class="month">{{ point.label }}</view>
        </view>
      </view>
      <view v-if="granularity === 'day'" class="day-slider-wrap">
        <slider
          class="day-slider"
          :value="dayOffset"
          :min="0"
          :max="dayMaxOffset"
          :step="1"
          activeColor="#22c55e"
          backgroundColor="#dbe3ef"
          block-color="#0f172a"
          block-size="18"
          @change="onDayOffsetChange"
        />
      </view>
    </view>

    <view class="card">
      <view class="section-title">分类投入占比</view>
      <view v-for="item in byCategoryPercent" :key="item.name" class="bar-item">
        <view class="bar-head">
          <view>{{ item.name }}</view>
          <view>{{ item.percent }}%</view>
        </view>
        <view class="bar-track">
          <view class="bar-fill" :style="{ width: item.percent + '%' }"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getAnalyticsSummary, listItems } from "@/services/appService";
import { requireAuth } from "@/utils/auth";

const summary = reactive(getAnalyticsSummary());
const trendData = ref<{ key: string; label: string; amount: number; height: number }[]>([]);
const granularity = ref<"day" | "month" | "year">("month");
const showGranularityBar = ref(false);
const DAY_WINDOW = 7;
const DAY_LOOKBACK = 365;
const dayOffset = ref(0);

const granularityLabel = {
  day: "按日",
  month: "按月",
  year: "按年",
} as const;

const granularityOptions: Array<{ value: "day" | "month" | "year"; label: string }> = [
  { value: "day", label: "按日" },
  { value: "month", label: "按月" },
  { value: "year", label: "按年" },
];

const byCategoryPercent = computed(() => {
  const total = summary.byCategory.reduce((sum, item) => sum + item.count, 0) || 1;
  return summary.byCategory.map((item) => ({
    name: item.name,
    percent: Math.round((item.count / total) * 100),
  }));
});
const dayMaxOffset = computed(() => Math.max(0, DAY_LOOKBACK - DAY_WINDOW));

onShow(() => {
  if (!requireAuth()) {
    return;
  }
  Object.assign(summary, getAnalyticsSummary());
  refreshTrend();
});

function refreshTrend() {
  const keys = buildRecentKeys(granularity.value);
  const amountMap = keys.reduce<Record<string, number>>((map, key) => {
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
      height: amount === 0 ? 0 : Math.max(52, Math.round((amount / max) * 148)),
    };
  });
}

function toggleGranularity() {
  showGranularityBar.value = !showGranularityBar.value;
}

function selectGranularity(value: "day" | "month" | "year") {
  granularity.value = value;
  showGranularityBar.value = false;
  refreshTrend();
}

function onDayOffsetChange(e: { detail: { value: number } }) {
  const raw = Number(e.detail.value) || 0;
  dayOffset.value = Math.max(0, Math.min(dayMaxOffset.value, raw));
  refreshTrend();
}

function buildRecentKeys(mode: "day" | "month" | "year"): string[] {
  if (mode === "day") {
    return buildRecentDayKeys(DAY_WINDOW, dayOffset.value);
  }
  if (mode === "year") {
    return buildRecentYearKeys(6);
  }
  return buildRecentMonthKeys(6);
}

function getKeyByGranularity(date: Date, mode: "day" | "month" | "year"): string {
  if (mode === "day") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  if (mode === "year") {
    return String(date.getFullYear());
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function keyToLabel(key: string, mode: "day" | "month" | "year"): string {
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

function formatAmount(value: number): string {
  return Math.round(value).toLocaleString("zh-CN");
}

function buildRecentMonthKeys(size: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = size - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function buildRecentDayKeys(size: number, offset = 0): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = size - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i - offset);
    keys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }
  return keys;
}

function buildRecentYearKeys(size: number): string[] {
  const year = new Date().getFullYear();
  const keys: string[] = [];
  for (let i = size - 1; i >= 0; i -= 1) {
    keys.push(String(year - i));
  }
  return keys;
}

function parseDateForTrend(value: string): Date {
  const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (dayPattern.test(value)) {
    const [year, month, day] = value.split("-").map((item) => Number(item));
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.metric .label {
  color: #627089;
  font-size: 25rpx;
}

.metric .value {
  margin-top: 8rpx;
  font-size: 40rpx;
  font-weight: 700;
}

.section-title {
  margin-bottom: 12rpx;
  font-weight: 600;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-link {
  font-size: 24rpx;
  color: #64748b;
}

.section-filter {
  position: relative;
}

.granularity-bar {
  position: absolute;
  top: calc(100% + 8rpx);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 8rpx;
  border-radius: 18rpx;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #f8fafc;
  z-index: 2;
}

.granularity-item {
  min-width: 88rpx;
  height: 52rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #334155;
}

.granularity-item-active {
  background: #0f172a;
  color: #fff;
  font-weight: 700;
}

.trend-wrap {
  margin-top: 8rpx;
  display: flex;
  align-items: flex-end;
  gap: 14rpx;
  height: 260rpx;
  padding-top: 30rpx;
  box-sizing: border-box;
}

.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
}

.bar-amount {
  font-size: 20rpx;
  color: #94a3b8;
  line-height: 1;
}

.trend-bar {
  width: 100%;
  border-radius: 16rpx 16rpx 0 0;
  background: linear-gradient(180deg, #34d399 0%, #22c55e 100%);
}

.month {
  font-size: 22rpx;
  color: #64748b;
}

.day-slider-wrap {
  margin-top: 16rpx;
  padding: 12rpx 16rpx 6rpx;
  border-radius: 18rpx;
  background: #f8fafc;
}

.day-slider {
  margin-top: 0;
}

.bar-item {
  margin-top: 12rpx;
}

.bar-head {
  display: flex;
  justify-content: space-between;
  font-size: 26rpx;
  color: #334155;
}

.bar-track {
  margin-top: 8rpx;
  height: 16rpx;
  border-radius: 999rpx;
  background: #e2e8f0;
}

.bar-fill {
  height: 100%;
  border-radius: 999rpx;
  background: #06b6d4;
}
</style>
