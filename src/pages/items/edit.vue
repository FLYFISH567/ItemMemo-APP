<template>
  <view class="page-wrap">
    <view class="card top-head">
      <view>
        <view class="page-title">{{ isEdit ? "编辑物品" : "新增物品" }}</view>
        <view class="page-subtitle">保持记录完整，方便后续查看成本变化</view>
      </view>
    </view>

    <view class="card">
      <view class="section-title">基础信息</view>

      <view class="field-label">物品名称</view>
      <input v-model="form.name" class="input" placeholder="例如：机械键盘 / 咖啡机" />

      <view class="split-line"></view>

      <view class="field-label">分类</view>
      <picker mode="selector" :range="categoryNames" :value="selectedCategoryIndex" @change="onCategoryChange">
        <view class="picker">{{ selectedCategoryName }} <text class="arrow">›</text></view>
      </picker>

      <view class="field-label">状态</view>
      <picker mode="selector" :range="statusLabels" :value="selectedStatusIndex" @change="onStatusChange">
        <view class="picker">{{ statusLabel(form.status) }} <text class="arrow">›</text></view>
      </picker>

      <view class="field-label">购买日期</view>
      <picker mode="date" :value="form.purchaseDate" start="2000-01-01" end="2099-12-31" @change="onDateChange">
        <view class="picker date-picker">
          <text class="calendar-icon">📅</text>
          <text>{{ form.purchaseDate }}</text>
        </view>
      </picker>

      <view class="field-label">购买价格</view>
      <input v-model.number="form.price" class="input" type="digit" placeholder="请输入价格" />
    </view>

    <view class="card">
      <view class="section-title">使用预览</view>
      <view class="preview-metrics">
        <view class="metric-box">
          <view class="metric-value">{{ previewHoldDays }} 天</view>
          <view class="metric-label">持有时长</view>
        </view>
        <view class="metric-box">
          <view class="metric-value">¥ {{ previewDailyCost }}</view>
          <view class="metric-label">日均成本</view>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="section-title">补充说明</view>
      <view class="field-label">备注</view>
      <textarea v-model="form.note" class="textarea" placeholder="记录使用感受、保养时间或购买渠道" />

      <view class="row">
        <button class="primary-btn" @click="handleSave">保存</button>
        <button v-if="isEdit" class="danger-btn" @click="handleDelete">删除</button>
      </view>
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
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import type { Category, ItemStatus } from "@/types";
import { createItem, deleteItem, getItemById, listCategories, updateItem } from "@/services/appService";
import AppModal from "@/components/AppModal.vue";
import { dailyCost } from "@/utils/date";

const id = ref("");
const isEdit = computed(() => Boolean(id.value));
const categories = ref<Category[]>(listCategories());
const statusOptions: ItemStatus[] = ["active", "idle", "archived"];
const statusLabels = ["使用中", "闲置中", "已弃用"];
const deleteModalVisible = ref(false);

const form = reactive({
  name: "",
  categoryId: categories.value[0]?.id || "",
  price: 0,
  purchaseDate: new Date().toISOString().slice(0, 10),
  status: "active" as ItemStatus,
  note: "",
});

const categoryNames = computed(() => categories.value.map((item) => item.name));
const selectedCategoryName = computed(() => categories.value.find((item) => item.id === form.categoryId)?.name || "未分类");
const selectedCategoryIndex = computed(() => Math.max(0, categories.value.findIndex((item) => item.id === form.categoryId)));
const selectedStatusIndex = computed(() => Math.max(0, statusOptions.indexOf(form.status)));
const previewHoldDays = computed(() => {
  const start = new Date(form.purchaseDate).getTime();
  const now = Date.now();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
});
const previewDailyCost = computed(() => {
  if (!form.price || form.price <= 0) return "0.00";
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

  if (query?.id) {
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
      note: item.note,
    });
  }
});

function onCategoryChange(e: { detail: { value: string } }) {
  form.categoryId = categories.value[Number(e.detail.value)].id;
}

function onStatusChange(e: { detail: { value: string } }) {
  form.status = statusOptions[Number(e.detail.value)];
}

function onDateChange(e: { detail: { value: string } }) {
  form.purchaseDate = e.detail.value;
}

function statusLabel(value: ItemStatus): string {
  if (value === "active") return "使用中";
  if (value === "idle") return "闲置中";
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
</script>

<style scoped>
.top-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input,
.picker,
.textarea {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 16rpx;
  padding: 18rpx;
  margin-bottom: 12rpx;
  box-sizing: border-box;
  background: #f8fafc;
  font-size: 34rpx;
  color: #0f172a;
}

.field-label {
  margin: 4rpx 0 8rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.split-line {
  margin: 8rpx 0 10rpx;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.arrow {
  color: #94a3b8;
}

.date-picker {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.calendar-icon {
  font-size: 24rpx;
}

.preview-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.metric-box {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24rpx;
  background: #fff;
  padding: 20rpx;
  text-align: center;
}

.metric-value {
  font-size: 48rpx;
  font-weight: 700;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-label {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #64748b;
}

.textarea {
  width: 100%;
  height: 220rpx;
  display: block;
}

.textarea :deep(.uni-textarea-wrapper) {
  width: 100%;
  height: 100%;
}

.textarea :deep(.uni-textarea-textarea) {
  width: 100% !important;
  height: 100% !important;
  box-sizing: border-box;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
  margin-top: 10rpx;
}

.row button {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 700;
}
</style>
