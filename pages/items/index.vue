<template>
  <view class="page-wrap">
    <view>
      <view class="page-title">物品列表</view>
      <view class="page-subtitle">筛选与管理物品</view>
    </view>

    <view class="card search-row">
      <view class="search-icon">🔍</view>
      <input v-model="keyword" class="search-input" placeholder="搜索物品名称或分类" @input="refresh" />
    </view>

    <view class="filter-row">
      <picker mode="selector" :range="categoryNames" :value="selectedCategoryIndex" @change="onCategoryChange">
        <view class="filter-pill">分类：{{ selectedCategoryName }}</view>
      </picker>
      <picker mode="selector" :range="statusNames" :value="selectedStatusIndex" @change="onStatusChange">
        <view class="filter-pill">状态：{{ selectedStatusName }}</view>
      </picker>
    </view>

    <view class="filter-tags">
      <view :class="['tag-btn', activeChip === 'all' ? 'tag-active-btn' : 'tag-normal-btn']" @click="setAll">全部</view>
      <button size="mini" :class="['sort-btn', activeChip === 'updatedAt' ? 'sort-btn-active' : '']" @click="handleSortClick('updatedAt')">
        {{ sortLabel('updatedAt', '更新时间') }}
      </button>
      <button size="mini" :class="['sort-btn', activeChip === 'price' ? 'sort-btn-active' : '']" @click="handleSortClick('price')">
        {{ sortLabel('price', '价格') }}
      </button>
      <button size="mini" :class="['sort-btn', activeChip === 'dailyCost' ? 'sort-btn-active' : '']" @click="handleSortClick('dailyCost')">
        {{ sortLabel('dailyCost', '日均成本') }}
      </button>
    </view>

    <view v-for="item in items" :key="item.id" class="card item-card" @click="goDetail(item.id)">
      <view class="row-top">
        <view class="emoji">{{ itemEmoji(item) }}</view>
        <view class="content">
          <view class="title-row">
            <view class="item-name">{{ item.name }}</view>
            <view :class="['status-badge', item.status === 'active' ? 'status-ok' : item.status === 'idle' ? 'status-warn' : 'status-arch']">
              {{ statusText(item.status) }}
            </view>
          </view>
          <view class="meta-row">{{ getCategoryName(item.categoryId) }} · 购入 ¥{{ item.price }} · 持有 {{ getItemExtra(item).holdDays }} 天</view>
          <view class="foot-row">
            <view>
              <view class="meta-label">日均成本</view>
              <view class="cost">¥{{ getItemExtra(item).dailyCost }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="items.length === 0" class="card empty">暂无数据，先新增一条记录</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import type { Item, ItemStatus } from "@/types";
import { getItemExtra, listCategories, listItems } from "@/services/appService";
import { requireAuth } from "@/utils/auth";

const ITEMS_CATEGORY_FILTER_KEY = "writedown_items_category_filter";

const keyword = ref("");
const items = ref<Item[]>([]);
const categories = ref(listCategories());
const selectedCategoryId = ref("");
const status = ref<"all" | ItemStatus>("all");
const sortBy = ref<"updatedAt" | "price" | "purchaseDate" | "dailyCost">("updatedAt");
const sortOrder = ref<"asc" | "desc">("desc");
const activeChip = ref<"all" | "updatedAt" | "price" | "dailyCost">("all");

const statusOptions = ["all", "active", "idle", "archived"];
const statusNames = ["全部", "使用中", "闲置中", "已弃用"];
const categoryNames = computed(() => ["全部", ...categories.value.map((c) => c.name)]);
const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value) {
    return "全部";
  }
  return categories.value.find((c) => c.id === selectedCategoryId.value)?.name || "全部";
});
const selectedCategoryIndex = computed(() => {
  if (!selectedCategoryId.value) {
    return 0;
  }
  const idx = categories.value.findIndex((c) => c.id === selectedCategoryId.value);
  return idx < 0 ? 0 : idx + 1;
});
const selectedStatusIndex = computed(() => Math.max(0, statusOptions.findIndex((item) => item === status.value)));
const selectedStatusName = computed(() => statusNames[selectedStatusIndex.value] || "全部");

onShow(() => {
  if (!requireAuth()) {
    return;
  }
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
    const parsed = JSON.parse(raw) as { categoryId?: string; categoryName?: string };
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
    // Ignore malformed cache and keep current filters.
  }
}

function refresh() {
  items.value = listItems({
    keyword: keyword.value,
    categoryId: selectedCategoryId.value,
    status: status.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
  });
}

function onCategoryChange(e: { detail: { value: string } }) {
  const index = Number(e.detail.value);
  selectedCategoryId.value = index === 0 ? "" : categories.value[index - 1].id;
  refresh();
}

function onStatusChange(e: { detail: { value: string } }) {
  status.value = statusOptions[Number(e.detail.value)] as "all" | ItemStatus;
  refresh();
}

function setSort(value: "updatedAt" | "price" | "purchaseDate" | "dailyCost") {
  sortBy.value = value;
  refresh();
}

function handleSortClick(value: "updatedAt" | "price" | "dailyCost") {
  // Price/daily-cost sort should always apply to the full item set.
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

function sortLabel(type: "updatedAt" | "price" | "dailyCost", baseLabel: string): string {
  if (activeChip.value !== type) {
    return baseLabel;
  }
  return `${baseLabel}${sortOrder.value === "desc" ? "↓" : "↑"}`;
}

function getCategoryName(categoryId: string): string {
  return categories.value.find((item) => item.id === categoryId)?.name || "未分类";
}

function statusText(value: ItemStatus): string {
  if (value === "active") return "使用中";
  if (value === "idle") return "闲置中";
  return "已弃用";
}

function itemEmoji(item: Item): string {
  if (item.icon) return item.icon;
  const name = getCategoryName(item.categoryId);
  if (name.includes("电子") || name.includes("数码")) return "📱";
  if (name.includes("家居")) return "🪑";
  if (name.includes("厨房")) return "☕";
  return "📦";
}

function tagClass(value: ItemStatus): string {
  if (value === "active") return "tag-active";
  if (value === "idle") return "tag-idle";
  return "tag-archived";
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/items/detail?id=${id}` });
}

</script>

<style scoped>
.search-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.search-icon {
  color: #64748b;
}

.search-input {
  flex: 1;
  font-size: 27rpx;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.filter-pill {
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 999rpx;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #f8fafc;
  color: #334155;
  text-align: center;
  font-size: 28rpx;
  font-weight: 600;
}

.filter-tags {
  display: flex;
  gap: 12rpx;
  overflow-x: auto;
  white-space: nowrap;
  align-items: center;
  padding-bottom: 2rpx;
}

.tag-btn,
.sort-btn {
  height: 72rpx;
  line-height: 72rpx;
  min-width: 156rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 700;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tag-active-btn {
  background: #0f172a;
  color: #ffffff;
  border: 1px solid #0f172a;
}

.tag-normal-btn {
  background: #e2e8f0;
  color: #0f172a;
}

.sort-btn {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #f1f5f9;
  color: #334155;
}

.sort-btn-active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

.item-card {
  margin-top: 6rpx;
}

.row-top {
  display: flex;
  gap: 12rpx;
}

.emoji {
  width: 86rpx;
  height: 86rpx;
  border-radius: 20rpx;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.content {
  flex: 1;
}

.title-row {
  display: flex;
  justify-content: space-between;
  gap: 12rpx;
  align-items: center;
}

.item-name {
  font-size: 34rpx;
  font-weight: 600;
}

.status-badge {
  border-radius: 999rpx;
  padding: 4rpx 12rpx;
  font-size: 22rpx;
}

.status-ok {
  background: #dcfce7;
  color: #166534;
}

.status-warn {
  background: #fef3c7;
  color: #92400e;
}

.status-arch {
  background: #e2e8f0;
  color: #334155;
}

.meta-row,
.meta-label {
  color: #64748b;
  font-size: 25rpx;
}

.foot-row {
  margin-top: 10rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cost {
  font-size: 34rpx;
  font-weight: 700;
}

.empty {
  text-align: center;
  color: #6f7891;
  font-size: 26rpx;
}
</style>
