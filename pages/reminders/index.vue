<template>
  <view class="page-wrap">
    <view>
      <view class="page-title">提醒中心</view>
      <view class="page-subtitle">集中处理提醒</view>
    </view>

    <view class="card action-block">
      <view class="action-top-row">
        <button class="soft-btn add-btn" @click="openAddReminder">+ 新增提醒</button>
        <button class="primary-btn bulk-btn" @click="handleCompleteAll">✓ 一键完成全部提醒</button>
      </view>
    </view>

    <view v-for="item in reminders" :key="item.id" class="card reminder-card">
      <view class="mini-delete" @click="handleDelete(item.id)">🗑</view>
      <view class="title-row">
        <view class="title-block">
          <view class="title">{{ item.title }}</view>
          <view class="title-extra">{{ reminderNote(item) }}</view>
        </view>
        <view class="right-meta">
          <view class="due-date">{{ displayDate(item.dueDate) }}</view>
          <view class="left-days">{{ leftDaysText(item.dueDate) }}</view>
          <view :class="['status', item.status === 'pending' ? 'pending' : 'done']">
            {{ item.status === "pending" ? "待处理" : "已完成" }}
          </view>
        </view>
      </view>
      <view class="row">
        <button class="action-btn delay-btn" @click="handleEdit(item)">编辑</button>
        <button class="action-btn complete-btn" @click="handleComplete(item.id)">完成</button>
      </view>
    </view>

    <view v-if="reminders.length === 0" class="card empty">暂无提醒</view>
    <button v-if="reminders.length > 0" class="danger-btn clear-all-btn" @click="handleClearAll">一键清空所有提醒</button>

    <view v-if="addReminderModalVisible" class="modal-mask" @click="addReminderModalVisible = false"></view>
    <view v-if="addReminderModalVisible" class="modal-panel">
      <view class="modal-title">新增提醒</view>

      <view class="field-label">提醒标题</view>
      <input v-model="addForm.title" class="field-input" placeholder="输入提醒标题" />

      <view class="field-label">备注</view>
      <input v-model="addForm.note" class="field-input" placeholder="输入备注（小字显示）" />

      <view class="field-label">日期</view>
      <picker mode="date" :value="addForm.dueDate" start="2000-01-01" end="2099-12-31" @change="onDateChange">
        <view class="field-input date-field">{{ addForm.dueDate }}</view>
      </picker>

      <view class="modal-actions">
        <button class="modal-btn cancel-btn" @click="addReminderModalVisible = false">取消</button>
        <button class="modal-btn confirm-btn" @click="confirmAddReminder">确定</button>
      </view>
    </view>
    <view v-if="editReminderModalVisible" class="modal-mask" @click="editReminderModalVisible = false"></view>
    <view v-if="editReminderModalVisible" class="modal-panel">
      <view class="modal-title">编辑提醒</view>

      <view class="field-label">提醒标题</view>
      <input v-model="editForm.title" class="field-input" placeholder="输入提醒标题" />

      <view class="field-label">备注</view>
      <input v-model="editForm.note" class="field-input" placeholder="输入备注（小字显示）" />

      <view class="field-label">日期</view>
      <picker mode="date" :value="editForm.dueDate" start="2000-01-01" end="2099-12-31" @change="onEditDateChange">
        <view class="field-input date-field">{{ editForm.dueDate }}</view>
      </picker>

      <view class="modal-actions">
        <button class="modal-btn cancel-btn" @click="editReminderModalVisible = false">取消</button>
        <button class="modal-btn confirm-btn" @click="confirmEditReminder">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import type { Reminder } from "@/types";
import { clearAllReminders, completeAllReminders, completeReminder, createCustomReminder, deleteReminder, listReminders, updateReminder } from "@/services/appService";
import { requireAuth } from "@/utils/auth";

const reminders = ref<Reminder[]>([]);
const addReminderModalVisible = ref(false);
const editReminderModalVisible = ref(false);
const editingReminderId = ref("");
const addForm = reactive({
  title: "",
  note: "",
  dueDate: new Date().toISOString().slice(0, 10),
});
const editForm = reactive({
  title: "",
  note: "",
  dueDate: new Date().toISOString().slice(0, 10),
});

onLoad((query) => {
  if (query?.create === "1") {
    addReminderModalVisible.value = true;
  }
});

onShow(() => {
  if (!requireAuth()) {
    return;
  }
  refresh();
});

function refresh() {
  reminders.value = listReminders();
}

function handleComplete(id: string) {
  completeReminder(id);
  uni.showToast({ title: "已完成", icon: "success" });
  refresh();
}

function handleEdit(item: Reminder) {
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
    },
  });
}

function handleDelete(id: string) {
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
    },
  });
}

function openAddReminder() {
  addForm.title = "";
  addForm.note = "";
  addForm.dueDate = new Date().toISOString().slice(0, 10);
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

function onDateChange(e: { detail: { value: string } }) {
  addForm.dueDate = e.detail.value;
}

function onEditDateChange(e: { detail: { value: string } }) {
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
      dueDate: editForm.dueDate,
    });
    uni.showToast({ title: "已保存", icon: "success" });
    editReminderModalVisible.value = false;
    refresh();
  } catch (err) {
    uni.showToast({ title: (err as Error).message, icon: "none" });
  }
}

function reminderNote(item: Reminder): string {
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

function displayDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function leftDaysText(dateStr: string): string {
  const due = new Date(dateStr).getTime();
  if (!Number.isFinite(due)) return "日期异常";
  const left = Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24));
  if (left > 0) return `剩余 ${left} 天`;
  if (left === 0) return "今天到期";
  return `已逾期 ${Math.abs(left)} 天`;
}
</script>

<style scoped>
.action-block {
  padding: 18rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.action-top-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.add-btn,
.bulk-btn {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  height: 78rpx;
  line-height: 78rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.bulk-btn {
  letter-spacing: 1rpx;
  box-shadow: 0 10rpx 20rpx rgba(15, 23, 42, 0.2);
}

.reminder-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.mini-delete {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 999rpx;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #f8fafc;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  line-height: 1;
  z-index: 1;
}

.title-row {
  display: flex;
  justify-content: space-between;
  gap: 12rpx;
  align-items: flex-start;
}

.title-block {
  flex: 1;
}

.title {
  font-size: 34rpx;
  font-weight: 600;
}

.title-extra {
  margin-top: 6rpx;
  font-size: 26rpx;
  color: #64748b;
}

.right-meta {
  min-width: 168rpx;
  text-align: right;
  padding-right: 58rpx;
  box-sizing: border-box;
}

.due-date {
  font-size: 50rpx;
  font-weight: 700;
  color: #0f172a;
}

.left-days {
  margin-top: 2rpx;
  font-size: 24rpx;
  color: #64748b;
}

.status {
  margin-top: 10rpx;
  display: inline-block;
  border-radius: 999rpx;
  padding: 10rpx 20rpx;
  font-size: 26rpx;
  font-weight: 700;
  white-space: nowrap;
}

.pending {
  background: #fef3c7;
  color: #92400e;
}

.done {
  background: #dcfce7;
  color: #166534;
}

.meta {
  color: #64748b;
  margin-top: 8rpx;
  font-size: 25rpx;
}

.row {
  margin-top: 12rpx;
  display: flex;
  gap: 12rpx;
}

.action-btn {
  flex: 1;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 18rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.complete-btn {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

.delay-btn {
  background: #eef2ff;
  color: #312e81;
  border-color: #c7d2fe;
}

.empty {
  text-align: center;
  color: #6f7891;
  font-size: 26rpx;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  z-index: 80;
}

.modal-panel {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx 24rpx 24rpx;
  z-index: 81;
  box-shadow: 0 20rpx 48rpx rgba(15, 23, 42, 0.22);
}

.modal-title {
  text-align: center;
  font-size: 44rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.field-label {
  margin: 10rpx 2rpx 8rpx;
  font-size: 26rpx;
  color: #475569;
  font-weight: 600;
}

.field-input {
  height: 84rpx;
  line-height: 84rpx;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 16rpx;
  background: #f8fafc;
  padding: 0 18rpx;
  font-size: 30rpx;
  color: #0f172a;
  box-sizing: border-box;
}

.date-field {
  display: flex;
  align-items: center;
}

.modal-actions {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.modal-btn {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 22rpx;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn {
  background: #e2e8f0;
  color: #334155;
  border-color: #d0d9e6;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);
}

.confirm-btn {
  background: #0f172a;
  color: #fff;
  border-color: #0f172a;
  box-shadow: 0 10rpx 20rpx rgba(15, 23, 42, 0.2);
}
.clear-all-btn {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 22rpx;
  font-size: 32rpx;
  font-weight: 700;
}
</style>
