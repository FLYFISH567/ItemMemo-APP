<script lang="ts">
const ONBOARDING_DONE_KEY = "writedown_onboarding_done";
const ONBOARDING_STATUS_SHOWN = "shown";

export default {
  onLaunch() {
    const onboardingStatus = uni.getStorageSync(ONBOARDING_DONE_KEY);
    if (!onboardingStatus) {
      uni.setStorageSync(ONBOARDING_DONE_KEY, ONBOARDING_STATUS_SHOWN);
    }
  },
  onShow() {
    // Keep app lifecycle hook for future global sync logic.
  },
};
</script>

<style>
page {
  background: #eef2f7;
  color: #0f172a;
  font-size: 28rpx;
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
}

.app-root {
  min-height: 100vh;
  background: #eef2f7;
  transition: background-color 0.25s ease, color 0.25s ease;
}

.card {
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 26rpx;
  padding: 24rpx;
  box-sizing: border-box;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.05);
}

.page-wrap {
  padding: 28rpx 24rpx calc(120rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  min-height: 100vh;
}

.page-title {
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 0.2rpx;
}

.page-subtitle {
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.45;
}

button {
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 999rpx;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 0 24rpx;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 600;
}

button::after {
  border: none;
}

button[size="mini"] {
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  padding: 0 16rpx;
}

.primary-btn {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
  font-weight: 600;
}

.danger-btn {
  background: #c93030;
  color: #ffffff;
  border-color: #c93030;
  font-weight: 600;
}

.soft-btn {
  background: #e2e8f0;
  color: #0f172a;
  border-color: #d0d9e6;
  font-weight: 600;
}

.gradient-banner {
  border-radius: 28rpx;
  padding: 28rpx;
  background: linear-gradient(140deg, #10b981 0%, #06b6d4 100%);
  color: #ffffff;
}

.soft-block {
  background: #f1f5f9;
  border-radius: 20rpx;
}

.section-title {
  margin-bottom: 12rpx;
  font-size: 34rpx;
  font-weight: 700;
}

.tag {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
}

.tag-active {
  background: #e7f6ed;
  color: #1f8f53;
}

.tag-idle {
  background: #fff3e3;
  color: #a06000;
}

.tag-archived {
  background: #eef0f5;
  color: #59667e;
}

.theme-dark {
  color: #f8fafc;
  background: #0b1020;
}

.theme-dark .card {
  background: #171717;
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.35);
}

.theme-dark .soft-block {
  background: #262626;
}

.theme-dark .page-subtitle {
  color: #a3a3a3;
}

.theme-dark .item-sub,
.theme-dark .meta,
.theme-dark .meta-row,
.theme-dark .meta-label,
.theme-dark .label,
.theme-dark .tip-item,
.theme-dark .stat-label {
  color: #b4b4b4 !important;
}

.theme-dark .input,
.theme-dark .picker,
.theme-dark .textarea,
.theme-dark .search-row,
.theme-dark .search-input,
.theme-dark .soft-btn,
.theme-dark .icon-btn,
.theme-dark .sort-btn,
.theme-dark .tag-normal-btn,
.theme-dark .stat-item,
.theme-dark .tip-item {
  background: #262626 !important;
  color: #f8fafc !important;
  border-color: rgba(255, 255, 255, 0.16) !important;
}

.theme-dark .tag-active-btn {
  background: #10b981;
  color: #052e2b;
}

.theme-dark .bar-track {
  background: #334155;
}

.theme-dark .bar-fill {
  background: #22d3ee;
}

.theme-dark .primary-btn {
  background: #10b981;
  color: #052e2b;
}

/* Ensure uni-input's native input has a real editable height on H5. */
uni-input.input {
  min-height: 88rpx;
  display: flex;
  align-items: center;
}

uni-input.input .uni-input-wrapper {
  width: 100%;
}

uni-input.input .uni-input-input {
  height: 44rpx !important;
  line-height: 44rpx !important;
  font-size: 28rpx;
}
</style>
