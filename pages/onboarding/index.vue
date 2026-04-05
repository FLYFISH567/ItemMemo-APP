<template>
  <view class="onboarding-wrap">
    <view class="mesh-orb orb-a"></view>
    <view class="mesh-orb orb-b"></view>

    <view class="hero card-float">
      <view class="hero-topline">WRITE DOWN, OWN LESS CHAOS</view>
      <view class="hero-title">物记</view>
      <view class="hero-sub">一款强调本地优先、轻量清晰的个人物品管理应用</view>

      <view class="hero-chips">
        <view class="hero-chip">本地优先</view>
        <view class="hero-chip">离线可用</view>
        <view class="hero-chip">快速导出</view>
      </view>
    </view>

    <view class="card feature-list card-float delay-1">
      <view class="feature-item">
        <view class="feature-emoji">📦</view>
        <view class="feature-main">
          <view class="feature-title">快速记录物品</view>
          <view class="feature-sub">分类、价格、购入时间、状态统一管理</view>
        </view>
      </view>
      <view class="feature-item">
        <view class="feature-emoji">🔔</view>
        <view class="feature-main">
          <view class="feature-title">到期提醒与闲置预警</view>
          <view class="feature-sub">自动汇总提醒，减少遗忘与重复购买</view>
        </view>
      </view>
      <view class="feature-item">
        <view class="feature-emoji">🧾</view>
        <view class="feature-main">
          <view class="feature-title">数据可控且可迁移</view>
          <view class="feature-sub">支持 JSON / CSV 导出，备份与换机都更稳</view>
        </view>
      </view>
    </view>

    <view class="trust-row card-float delay-2">
      <view class="trust-item">
        <view class="trust-value">100%</view>
        <view class="trust-label">本地存储</view>
      </view>
      <view class="trust-item">
        <view class="trust-value">0</view>
        <view class="trust-label">强制登录</view>
      </view>
      <view class="trust-item">
        <view class="trust-value">2 步</view>
        <view class="trust-label">即可上手</view>
      </view>
    </view>

    <view class="action-row card-float delay-3">
      <button class="ghost-btn" @click="skip">稍后查看</button>
      <button class="start-btn" @click="startNow">开始使用</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

const ONBOARDING_DONE_KEY = "writedown_onboarding_done";
const ONBOARDING_STATUS_DONE = "done";

onMounted(() => {
  if (uni.getStorageSync(ONBOARDING_DONE_KEY) === ONBOARDING_STATUS_DONE) {
    uni.switchTab({ url: "/pages/dashboard/index" });
  }
});

function markDone() {
  uni.setStorageSync(ONBOARDING_DONE_KEY, ONBOARDING_STATUS_DONE);
}

function skip() {
  markDone();
  uni.switchTab({ url: "/pages/dashboard/index" });
}

function startNow() {
  markDone();
  uni.switchTab({ url: "/pages/dashboard/index" });
}
</script>

<style scoped>
.onboarding-wrap {
  --bg-base: #ecf6f4;
  --text-main: #0f172a;
  --text-sub: #445164;
  --chip-bg: rgba(255, 255, 255, 0.62);
  --line-soft: rgba(10, 20, 35, 0.08);
  --accent-deep: #126a5c;

  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 36rpx 24rpx calc(132rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  background:
    radial-gradient(circle at 4% 10%, rgba(34, 197, 94, 0.35), transparent 34%),
    radial-gradient(circle at 90% 8%, rgba(6, 182, 212, 0.28), transparent 36%),
    linear-gradient(165deg, #f5fbfa 0%, #e7f4f0 45%, #edf2fb 100%);
}

.hero {
  position: relative;
  z-index: 2;
  padding: 26rpx;
  border-radius: 28rpx;
  border: 1px solid var(--line-soft);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.84), rgba(248, 251, 255, 0.68));
  backdrop-filter: blur(8px);
}

.hero-topline {
  font-size: 22rpx;
  letter-spacing: 1.8rpx;
  color: var(--accent-deep);
  font-weight: 700;
}

.hero-title {
  margin-top: 10rpx;
  font-size: 72rpx;
  line-height: 1.05;
  font-weight: 900;
  color: var(--text-main);
  text-shadow: 0 8rpx 30rpx rgba(18, 106, 92, 0.12);
}

.hero-sub {
  margin-top: 14rpx;
  color: var(--text-sub);
  font-size: 27rpx;
  line-height: 1.5;
}

.hero-chips {
  margin-top: 18rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.hero-chip {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #134e4a;
  background: var(--chip-bg);
  border: 1px solid rgba(20, 90, 76, 0.14);
}

.feature-list {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding-top: 20rpx;
  padding-bottom: 20rpx;
}

.feature-item {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
  padding: 8rpx 0;
}

.feature-emoji {
  width: 64rpx;
  height: 64rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #ffffff, #e9f4f2);
  font-size: 32rpx;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.feature-main {
  flex: 1;
}

.feature-title {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--text-main);
}

.feature-sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #5f6f83;
  line-height: 1.5;
}

.trust-row {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
  padding: 16rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(10, 20, 35, 0.08);
}

.trust-item {
  text-align: center;
  padding: 10rpx 4rpx;
}

.trust-value {
  font-size: 30rpx;
  font-weight: 800;
  color: #0b6156;
}

.trust-label {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #5f6f83;
}

.action-row {
  margin-top: auto;
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.ghost-btn {
  background: rgba(255, 255, 255, 0.78);
  color: #0f172a;
  border-color: rgba(15, 23, 42, 0.14);
}

.start-btn {
  background: linear-gradient(135deg, #0f766e 0%, #0ea5a2 100%);
  color: #ffffff;
  border: 1px solid #0f766e;
  box-shadow: 0 12rpx 22rpx rgba(15, 118, 110, 0.28);
}

.mesh-orb {
  position: absolute;
  border-radius: 999rpx;
  filter: blur(8rpx);
  pointer-events: none;
}

.orb-a {
  width: 320rpx;
  height: 320rpx;
  right: -90rpx;
  top: 120rpx;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0) 70%);
}

.orb-b {
  width: 280rpx;
  height: 280rpx;
  left: -80rpx;
  bottom: 180rpx;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.34) 0%, rgba(6, 182, 212, 0) 72%);
}

.card-float {
  animation: lift-in 0.5s ease both;
}

.delay-1 {
  animation-delay: 0.08s;
}

.delay-2 {
  animation-delay: 0.14s;
}

.delay-3 {
  animation-delay: 0.2s;
}

@keyframes lift-in {
  from {
    opacity: 0;
    transform: translateY(20rpx) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>