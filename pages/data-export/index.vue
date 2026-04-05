<template>
  <view class="page-wrap">
    <view>
      <view class="page-title">数据导出</view>
      <view class="page-subtitle">迁移手机与本地备份</view>
    </view>

    <view class="card setting-card">
      <view class="label">数据导出（复制到剪贴板）</view>
      <view class="row export-grid">
        <button class="soft-btn panel-btn" @click="handleExport">导出 JSON</button>
      </view>
      <button class="primary-btn full-btn import-btn" @click="openImportModal">导入 JSON（粘贴）</button>
    </view>

    <view class="card tip-card">
      <view class="tip-title">迁移步骤</view>
      <view class="tip-item">1. 旧手机点击 导出 JSON 并复制</view>
      <view class="tip-item">2. 通过微信或网盘发送到新手机</view>
      <view class="tip-item">3. 新手机粘贴 JSON 后导入</view>
    </view>

    <view v-if="importModalVisible" class="import-mask" @click="closeImportModal"></view>
    <view v-if="importModalVisible" class="import-panel">
      <view class="import-title">导入 JSON</view>
      <view class="import-desc">粘贴从旧手机导出的 JSON 内容，导入后将覆盖本地数据。</view>
      <textarea v-model="importJson" class="import-textarea" placeholder="请粘贴完整 JSON" :maxlength="-1" />
      <view class="import-actions">
        <button class="soft-btn panel-btn" @click="closeImportModal">取消</button>
        <button class="danger-btn panel-btn" @click="confirmImport">导入并覆盖</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { importDataFromJson, exportData } from "@/services/appService";

const importModalVisible = ref(false);
const importJson = ref("");

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
    uni.showToast({ title: (err as Error).message, icon: "none" });
  }
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

.export-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.import-btn {
  margin-top: 14rpx;
}

.tip-card {
  border-radius: 26rpx;
}

.tip-title {
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.tip-item {
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.7;
}

.import-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  z-index: 90;
}

.import-panel {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 28rpx;
  padding: 24rpx;
  z-index: 91;
  box-shadow: 0 20rpx 48rpx rgba(15, 23, 42, 0.22);
}

.import-title {
  text-align: center;
  font-size: 40rpx;
  font-weight: 700;
}

.import-desc {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #64748b;
  line-height: 1.5;
}

.import-textarea {
  margin-top: 14rpx;
  width: 100%;
  height: 320rpx;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 16rpx;
  background: #f8fafc;
  padding: 16rpx;
  font-size: 24rpx;
  box-sizing: border-box;
}

.import-actions {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}
</style>
