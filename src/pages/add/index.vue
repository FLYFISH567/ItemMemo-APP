<template>
  <view class="page-wrap">
    <view class="top-head card">
      <view>
        <view class="page-title">新增物品</view>
        <view class="page-subtitle">记录购置与使用状态</view>
      </view>
      <view class="head-right">
        <view class="category-btn" @click="openAddReminderModal">新增提醒</view>
        <view class="category-btn" @click="handleQuickAddCategory">新增分类</view>
      </view>
    </view>

    <view class="card">
      <view class="section-title">基础信息</view>

      <view class="field-label">物品名称</view>
      <view class="name-row">
        <view class="name-icon" @click="openIconModal">
          <view class="name-emoji">{{ selectedIconOption.icon }}</view>
          <view class="name-icon-tip">更换</view>
        </view>
        <input v-model="form.name" class="input name-input" placeholder="例如：MacBook Air / 电动牙刷 / 豆包会员" />
      </view>

      <view class="split-line"></view>

      <view class="field-label">分类</view>
      <view class="picker" @click="openSheet('category')">{{ selectedCategoryName }} <text class="arrow">›</text></view>

      <view class="field-label">状态</view>
      <view class="picker" @click="openSheet('status')">{{ statusText(form.status) }} <text class="arrow">›</text></view>

      <view class="field-label">购买日期</view>
      <picker mode="date" :value="form.purchaseDate" start="2000-01-01" end="2099-12-31" @change="onDateChange">
        <view class="picker date-picker">
          <text class="calendar-icon">📅</text>
          <text>{{ form.purchaseDate }}</text>
        </view>
      </picker>

      <view class="field-label">购买价格</view>
      <input v-model.number="form.price" class="input" type="digit" placeholder="请输入购买价格，如 6999" />
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
      <view class="preview-tip">预览按演示日期 {{ form.purchaseDate }} 计算，方便你在画布里稳定查看效果。</view>
    </view>

    <view class="card">
      <view class="section-title">补充说明</view>
      <view class="field-label">备注</view>
      <textarea v-model="form.note" class="textarea" placeholder="可记录使用感受、保修时间、购买渠道等" />

      <view class="row">
        <button class="soft-btn" @click="handleCancel">取消</button>
        <button class="primary-btn" @click="handleCreate">保存</button>
      </view>
    </view>

    <view v-if="sheetType" class="sheet-mask" @click="closeSheet"></view>
    <view v-if="sheetType" class="bottom-sheet">
      <view class="sheet-head">
        <view class="sheet-title">{{ sheetType === 'category' ? '选择分类' : '选择状态' }}</view>
        <view class="sheet-close" @click="closeSheet">关闭</view>
      </view>
      <view v-for="(option, idx) in sheetOptions" :key="option" class="sheet-item" @click="selectSheetOption(idx)">
        <view :class="['sheet-text', idx === sheetSelectedIndex ? 'sheet-text-active' : '']">{{ option }}</view>
        <view v-if="idx === sheetSelectedIndex" class="sheet-check">✓</view>
      </view>
    </view>

    <AppModal
      v-model:visible="addCategoryModalVisible"
      title="新增分类"
      :showInput="true"
      input-placeholder="输入分类名称"
      @confirm="confirmQuickAddCategory"
    />

    <view v-if="addReminderModalVisible" class="sheet-mask" @click="addReminderModalVisible = false"></view>
    <view v-if="addReminderModalVisible" class="reminder-panel">
      <view class="sheet-head">
        <view class="sheet-title">新增提醒</view>
        <view class="sheet-close" @click="addReminderModalVisible = false">关闭</view>
      </view>

      <view class="reminder-body">
        <view class="field-label">提醒标题</view>
        <input v-model="reminderForm.title" class="input" placeholder="例如：清洁键盘 / 更换滤芯" />

        <view class="field-label">备注</view>
        <input v-model="reminderForm.note" class="input" placeholder="可选，作为小字显示" />

        <view class="field-label">日期</view>
        <picker mode="date" :value="reminderForm.dueDate" start="2000-01-01" end="2099-12-31" @change="onReminderDateChange">
          <view class="picker date-picker">
            <text class="calendar-icon">📅</text>
            <text>{{ reminderForm.dueDate }}</text>
          </view>
        </picker>

        <view class="row reminder-actions">
          <button class="soft-btn" @click="addReminderModalVisible = false">取消</button>
          <button class="primary-btn" @click="confirmAddReminder">确定</button>
        </view>
      </view>
    </view>

    <view v-if="iconModalVisible" class="sheet-mask" @click="closeIconModal"></view>
    <view v-if="iconModalVisible" class="icon-modal">
      <view class="icon-modal-head">
        <view class="sheet-title">选择图标</view>
        <view class="sheet-close" @click="closeIconModal">✕</view>
      </view>
      <view class="icon-grid">
        <view
          v-for="option in iconOptions"
          :key="option.icon"
          :class="['icon-card', form.icon === option.icon ? 'icon-card-active' : '']"
          @click="selectIcon(option.icon)"
        >
          <view class="icon-card-emoji">{{ option.icon }}</view>
          <view class="icon-card-label">{{ option.label }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { Category, ItemStatus } from "@/types";
import { addCategory, createCustomReminder, createItem, listCategories } from "@/services/appService";
import { dailyCost } from "@/utils/date";
import AppModal from "@/components/AppModal.vue";

const categories = ref<Category[]>(listCategories());
const statusOptions: ItemStatus[] = ["active", "idle", "archived"];
const statusOptionsText = ["使用中", "闲置中", "已弃用"];
const sheetType = ref<"category" | "status" | "">("");
const addCategoryModalVisible = ref(false);
const addReminderModalVisible = ref(false);
const iconModalVisible = ref(false);
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
  { icon: "☕", label: "消耗" },
] as const;

const form = reactive({
  name: "",
  icon: "📦",
  categoryId: categories.value[0]?.id || "",
  price: 0,
  purchaseDate: new Date().toISOString().slice(0, 10),
  status: "active" as ItemStatus,
  note: "",
});
const reminderForm = reactive({
  title: "",
  note: "",
  dueDate: new Date().toISOString().slice(0, 10),
});

const categoryNames = computed(() => categories.value.map((item) => item.name));
const selectedCategoryName = computed(() => categories.value.find((item) => item.id === form.categoryId)?.name || "未分类");
const selectedIconOption = computed(() => iconOptions.find((item) => item.icon === form.icon) || iconOptions[0]);
const sheetOptions = computed(() => (sheetType.value === "category" ? categoryNames.value : statusOptionsText));
const sheetSelectedIndex = computed(() => {
  if (sheetType.value === "category") {
    const idx = categories.value.findIndex((item) => item.id === form.categoryId);
    return idx < 0 ? 0 : idx;
  }
  return Math.max(0, statusOptions.findIndex((item) => item === form.status));
});
const previewHoldDays = computed(() => {
  const start = new Date(form.purchaseDate).getTime();
  const now = new Date().getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
});
const previewDailyCost = computed(() => {
  if (!form.price || form.price <= 0) return "0.00";
  return dailyCost(form.price, form.purchaseDate).toFixed(2);
});

function openSheet(type: "category" | "status") {
  if (type === "category" && !categoryNames.value.length) {
    uni.showToast({ title: "暂无分类，请先新增", icon: "none" });
    return;
  }
  sheetType.value = type;
}

function closeSheet() {
  sheetType.value = "";
}

function selectSheetOption(index: number) {
  if (sheetType.value === "category") {
    form.categoryId = categories.value[index].id;
  } else {
    form.status = statusOptions[index];
  }
  closeSheet();
}

function onDateChange(e: { detail: { value: string } }) {
  form.purchaseDate = e.detail.value;
}

function statusText(value: ItemStatus): string {
  if (value === "active") return "使用中";
  if (value === "idle") return "闲置中";
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

function selectIcon(icon: string) {
  form.icon = icon;
  closeIconModal();
}

function confirmQuickAddCategory(inputValue: string) {
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
    uni.showToast({ title: (err as Error).message, icon: "none" });
  }
}

function openAddReminderModal() {
  reminderForm.title = "";
  reminderForm.note = "";
  reminderForm.dueDate = new Date().toISOString().slice(0, 10);
  addReminderModalVisible.value = true;
}

function onReminderDateChange(e: { detail: { value: string } }) {
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
    dueDate: reminderForm.dueDate,
  });
  addReminderModalVisible.value = false;
  uni.showToast({ title: "提醒已新增", icon: "success" });
}

function resetForm() {
  form.name = "";
  form.icon = "📦";
  form.price = 0;
  form.note = "";
  form.purchaseDate = new Date().toISOString().slice(0, 10);
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
</script>

<style scoped>
.top-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.head-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.category-btn {
  border-radius: 999rpx;
  background: #e2e8f0;
  color: #0f172a;
  font-size: 23rpx;
  line-height: 1;
  padding: 14rpx 16rpx;
  font-weight: 600;
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
  font-size: 37rpx;
  color: #0f172a;
}

.field-label {
  margin: 4rpx 0 8rpx;
  font-size: 34rpx;
  font-weight: 600;
}

.name-row {
  display: grid;
  grid-template-columns: 110rpx minmax(0, 1fr);
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.name-icon {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 22rpx;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.name-emoji {
  font-size: 48rpx;
}

.name-icon-tip {
  font-size: 20rpx;
  color: #8292ae;
  line-height: 1;
}

.name-input {
  margin-bottom: 0;
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
  font-size: 54rpx;
  font-weight: 700;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-label {
  margin-top: 8rpx;
  font-size: 27rpx;
  color: #64748b;
}

.preview-tip {
  margin-top: 12rpx;
  color: #64748b;
  font-size: 25rpx;
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
  display: flex;
  gap: 16rpx;
  margin-top: 10rpx;
}

.row button {
  flex: 1;
  height: 86rpx;
  line-height: 86rpx;
  font-size: 32rpx;
  font-weight: 700;
  border-radius: 999rpx;
}

.soft-btn {
  background: #e2e8f0;
  color: #0f172a;
  border: 1px solid #d0d9e6;
}

.primary-btn {
  border: 1px solid #0f172a;
}

.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.38);
  z-index: 30;
}

.bottom-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  z-index: 31;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.sheet-title {
  font-size: 30rpx;
  font-weight: 700;
}

.sheet-close {
  color: #94a3b8;
}

.sheet-item {
  padding: 22rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.sheet-text {
  font-size: 30rpx;
  color: #0f172a;
}

.sheet-text-active,
.sheet-check {
  color: #2563eb;
  font-weight: 700;
}

.icon-modal {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  max-height: 78vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 30rpx;
  z-index: 32;
  box-shadow: 0 20rpx 48rpx rgba(15, 23, 42, 0.2);
}

.reminder-panel {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 28rpx;
  z-index: 32;
  box-shadow: 0 20rpx 48rpx rgba(15, 23, 42, 0.22);
}

.reminder-body {
  padding: 18rpx 24rpx 24rpx;
}

.reminder-actions {
  margin-top: 10rpx;
}

.icon-modal-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #fff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.icon-grid {
  padding: 18rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.icon-card {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 26rpx;
  background: #f8fafc;
  min-height: 148rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8rpx;
}

.icon-card-active {
  background: #0f172a;
  border-color: #0f172a;
}

.icon-card-emoji {
  font-size: 42rpx;
}

.icon-card-label {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
}

.icon-card-active .icon-card-label {
  color: #ffffff;
}

.theme-dark .bottom-sheet {
  background: #171717;
}

.theme-dark .sheet-item,
.theme-dark .sheet-head {
  border-color: rgba(255, 255, 255, 0.1);
}

.theme-dark .sheet-text {
  color: #f8fafc;
}

.theme-dark .metric-box {
  background: #171717;
  border-color: rgba(255, 255, 255, 0.12);
}

.theme-dark .icon-modal,
.theme-dark .icon-modal-head {
  background: #171717;
}

.theme-dark .reminder-panel,
.theme-dark .reminder-body {
  background: #171717;
}

.theme-dark .icon-card {
  background: #262626;
  border-color: rgba(255, 255, 255, 0.12);
}

.theme-dark .icon-card-label {
  color: #f8fafc;
}
</style>
