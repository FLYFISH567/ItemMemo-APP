<template>
  <view class="page-wrap">
    <view class="card profile-card">
      <view class="profile-row">
        <view class="avatar">🗂️</view>
        <view>
          <view class="page-title">我的</view>
          <view class="page-subtitle">本地优先，长期可用</view>
        </view>
      </view>

      <view class="stats-grid">
        <view class="soft-block stat-item">
          <view class="stat-value">{{ stats.totalItems }}</view>
          <view class="stat-label">总物品</view>
        </view>
        <view class="soft-block stat-item">
          <view class="stat-value">{{ stats.totalReminders }}</view>
          <view class="stat-label">累计提醒</view>
        </view>
        <view class="soft-block stat-item">
          <view class="stat-value">{{ stats.exportCount }}</view>
          <view class="stat-label">导出次数</view>
        </view>
      </view>
    </view>

    <view class="action-list">
      <view class="card action-item" @click="go('/pages/categories/index')">
        <view>
          <view class="action-title">分类管理</view>
          <view class="action-sub">管理分类与迁移</view>
        </view>
        <view class="arrow">›</view>
      </view>
      <view class="card action-item" @click="go('/pages/reminders/index')">
        <view>
          <view class="action-title">提醒中心</view>
          <view class="action-sub">管理提醒与预警</view>
        </view>
        <view class="arrow">›</view>
      </view>
      <view class="card action-item" @click="go('/pages/settings/index')">
        <view>
          <view class="action-title">设置</view>
          <view class="action-sub">阈值、主题、恢复</view>
        </view>
        <view class="arrow">›</view>
      </view>
      <view class="card action-item" @click="go('/pages/data-export/index')">
        <view>
          <view class="action-title">数据导出</view>
          <view class="action-sub">导出 / 导入 JSON</view>
        </view>
        <view class="arrow">›</view>
      </view>
    </view>

    <view class="card">
      <view class="section-title">存储与同步说明</view>
      <view class="tips">
        <view class="soft-block tip-item">当前版本默认本地存储，不依赖云端登录能力。</view>
        <view class="soft-block tip-item">支持导出 JSON / CSV 用于备份或迁移。</view>
        <view class="soft-block tip-item">后续可平滑扩展局域网或 NAS 备份。</view>
      </view>
    </view>

    <button class="danger-btn logout-btn" @click="logout">返回首页</button>
  </view>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getProfileSummary } from "@/services/appService";
import { requireAuth } from "@/utils/auth";

const stats = reactive({
  totalItems: 0,
  totalReminders: 0,
  exportCount: 0,
});

onShow(() => {
  if (!requireAuth()) {
    return;
  }
  Object.assign(stats, getProfileSummary());
});

function go(url: string) {
  uni.navigateTo({ url });
}

function logout() {
  uni.switchTab({ url: "/pages/dashboard/index" });
}
</script>

<style scoped>
.profile-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.avatar {
  width: 84rpx;
  height: 84rpx;
  border-radius: 22rpx;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.stats-grid {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.stat-item {
  padding: 14rpx;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 700;
}

.stat-label {
  margin-top: 4rpx;
  color: #64748b;
  font-size: 24rpx;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-title {
  font-size: 32rpx;
  font-weight: 600;
}

.action-sub {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #64748b;
}

.arrow {
  font-size: 36rpx;
  color: #94a3b8;
}

.tips {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.tip-item {
  padding: 14rpx;
  font-size: 24rpx;
  color: #334155;
}

.logout-btn {
  width: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 48rpx;
  margin: 0 auto;
  background: #cf2f33;
  border-color: #cf2f33;
  border-radius: 22rpx;
  font-size: 32rpx;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 10rpx 20rpx rgba(207, 47, 51, 0.16);
}
</style>
