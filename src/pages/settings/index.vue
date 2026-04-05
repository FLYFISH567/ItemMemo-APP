<template>
  <view class="page-wrap">
    <view>
      <view class="page-title">设置</view>
      <view class="page-subtitle">管理阈值与数据</view>
    </view>

    <view class="card setting-card">
      <view class="label">高日均阈值（元/天）</view>
      <input v-model.number="settings.dailyCostThreshold" class="input" type="digit" />
      <view class="label">闲置阈值（天）</view>
      <input v-model.number="settings.idleThresholdDays" class="input" type="number" />
      <view class="label">默认提醒时间</view>
      <input v-model="settings.defaultReminderTime" class="input" placeholder="09:00" />
      <button class="primary-btn full-btn" @click="handleSave">保存设置</button>
    </view>

    <view class="card setting-card">
      <view class="label">主题模式</view>
      <view class="row theme-grid">
        <button :class="['panel-btn', mode === 'light' ? 'primary-btn' : 'soft-btn']" @click="setMode('light')">浅色</button>
        <button :class="['panel-btn', mode === 'dark' ? 'primary-btn' : 'soft-btn']" @click="setMode('dark')">深色</button>
      </view>
    </view>

    <view class="card setting-card danger-wrap">
      <button class="danger-btn full-btn" @click="handleReset">恢复演示数据</button>
    </view>

    <AppModal
      v-model:visible="resetModalVisible"
      title="确认恢复"
      message="将覆盖当前本地数据"
      :dangerConfirm="true"
      confirm-text="恢复"
      @confirm="confirmReset"
    />
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getSettings, resetDemoData, updateSettings } from "@/services/appService";
import type { AppSettings } from "@/types";
import { getThemeMode, setThemeMode, type ThemeMode } from "@/utils/theme";
import AppModal from "@/components/AppModal.vue";

const settings = reactive<AppSettings>({
  dailyCostThreshold: 5,
  idleThresholdDays: 60,
  defaultReminderTime: "09:00",
});
const mode = ref<ThemeMode>("light");
const resetModalVisible = ref(false);

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

function setMode(value: ThemeMode) {
  setThemeMode(value);
  mode.value = value;
  uni.showToast({ title: `已切换${value === 'dark' ? '深色' : '浅色'}模式`, icon: "none" });
}
</script>

<style scoped>
.setting-card {
  border-radius: 30rpx;
  padding: 24rpx;
}

.label {
  margin: 10rpx 2rpx 10rpx;
  color: #64748b;
  font-size: 28rpx;
  font-weight: 600;
}

.input {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 22rpx;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 22rpx;
  margin-bottom: 14rpx;
  background: #f8fafc;
  font-size: 30rpx;
  box-sizing: border-box;
}

.row {
  display: flex;
  gap: 14rpx;
}

.panel-btn {
  width: 100%;
  min-width: 0;
  height: 78rpx;
  line-height: 78rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.full-btn {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 22rpx;
  font-size: 32rpx;
  font-weight: 700;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.danger-wrap {
  background: linear-gradient(180deg, #fff 0%, #fff5f5 100%);
}

</style>
