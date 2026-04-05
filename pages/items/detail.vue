<template>
  <view class="page-wrap" v-if="item">
    <view class="card hero-card">
      <view class="card-actions">
        <button size="mini" class="soft-btn action-btn" @click="goEdit">编辑</button>
      </view>
      <view class="hero-icon">{{ itemEmoji }}</view>
      <view class="title-row">
        <view>
          <view class="page-title">{{ item.name }}</view>
          <view class="page-subtitle">{{ categoryName }}</view>
        </view>
        <view :class="['status', item.status === 'active' ? 'ok' : item.status === 'idle' ? 'warn' : 'arch']">
          {{ item.status === "active" ? "使用中" : item.status === "idle" ? "闲置中" : "已弃用" }}
        </view>
      </view>

      <view class="metrics">
        <view class="soft-block metric-item">
          <view class="metric-label">购入价格</view>
          <view class="metric-value">¥{{ item.price }}</view>
        </view>
        <view class="soft-block metric-item">
          <view class="metric-label">持有时长</view>
          <view class="metric-value">{{ extra.holdDays }} 天</view>
        </view>
        <view class="soft-block metric-item">
          <view class="metric-label">日均成本</view>
          <view class="metric-value">¥{{ extra.dailyCost }}</view>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="section-title">基础信息</view>
      <view class="line"><text>购买日期</text><text>{{ item.purchaseDate }}</text></view>
      <view class="line"><text>最近使用时间</text><text>{{ recentUsedAtText }}</text></view>
      <view class="line"><text>最近提醒</text><text>{{ reminderText }}</text></view>
      <view class="line"><text>备注</text><text>{{ item.note || "-" }}</text></view>
    </view>

    <view class="action-row">
      <button class="action-btn" @click="handleUse">记录一次使用</button>
      <button class="danger-btn action-btn" @click="handleDelete">删除</button>
    </view>

    <AppModal
      v-model:visible="deleteModalVisible"
      title="确认删除"
      message="删除后不可恢复"
      :dangerConfirm="true"
      confirm-text="删除"
      @confirm="confirmDelete"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { deleteItem, getItemById, getItemExtra, listCategories, markItemUsed } from "@/services/appService";
import type { Item } from "@/types";
import AppModal from "@/components/AppModal.vue";

const item = ref<Item>();
const categories = listCategories();
const id = ref("");
const deleteModalVisible = ref(false);

const extra = computed(() => (item.value ? getItemExtra(item.value) : { holdDays: 0, dailyCost: 0 }));
const categoryName = computed(
  () => categories.find((category) => category.id === item.value?.categoryId)?.name || "未分类"
);
const reminderText = computed(() => {
  if (!item.value) return "无提醒";
  return item.value.status === "active" ? "建议 90 天维护一次" : "无提醒";
});
const recentUsedAtText = computed(() => {
  if (!item.value) return "-";
  return item.value.lastUsedAt || "-";
});
const itemEmoji = computed(() => {
  if (item.value?.icon) return item.value.icon;
  const name = categoryName.value;
  if (name.includes("电子") || name.includes("数码")) return "📱";
  if (name.includes("家居")) return "🪑";
  if (name.includes("厨房")) return "☕";
  return "📦";
});

onLoad((query) => {
  id.value = String(query?.id || "");
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
</script>

<style scoped>
.hero-card {
  position: relative;
}

.card-actions {
  display: flex;
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  gap: 10rpx;
  z-index: 2;
}

.soft-btn {
  border-radius: 999rpx;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #f1f5f9;
  color: #0f172a;
}

.action-btn {
  min-width: 132rpx;
}

.hero-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 28rpx;
  background: #f1f5f9;
  font-size: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-row {
  margin-top: 12rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status {
  border-radius: 999rpx;
  padding: 6rpx 12rpx;
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

.metrics {
  margin-top: 14rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
}

.metric-item {
  padding: 14rpx;
}

.metric-label {
  color: #64748b;
  font-size: 22rpx;
}

.metric-value {
  margin-top: 6rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.line {
  display: flex;
  justify-content: space-between;
  padding: 10rpx 0;
  border-bottom: 1rpx solid #e8edf7;
  gap: 16rpx;
}

.action-row {
  display: flex;
  gap: 12rpx;
  background: transparent;
}

.action-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 999rpx;
  font-size: 34rpx;
  font-weight: 700;
}
</style>
