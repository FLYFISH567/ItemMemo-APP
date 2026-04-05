<template>
  <view class="custom-tabbar-wrap">
    <view class="custom-tabbar card">
      <view
        v-for="item in tabs"
        :key="item.pagePath"
        :class="['tab-item', activePath === item.pagePath ? 'tab-item-active' : '']"
        @click="switchTab(item.pagePath)"
      >
        <view :class="['tab-icon', activePath === item.pagePath ? 'tab-icon-active' : '']">{{ item.icon }}</view>
        <view :class="['tab-text', activePath === item.pagePath ? 'tab-text-active' : '']">{{ item.text }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

interface TabItem {
  pagePath: string;
  text: string;
  icon: string;
}

const tabs: TabItem[] = [
  { pagePath: "pages/dashboard/index", text: "首页", icon: "⌂" },
  { pagePath: "pages/items/index", text: "物品", icon: "▦" },
  { pagePath: "pages/add/index", text: "新增", icon: "+" },
  { pagePath: "pages/analytics/index", text: "统计", icon: "◷" },
  { pagePath: "pages/me/index", text: "我的", icon: "◉" },
];

const activePath = ref("pages/dashboard/index");

function refreshActivePath() {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  if (!current) {
    return;
  }
  const route = String((current as { route?: string }).route || "");
  const matched = tabs.find((item) => item.pagePath === route);
  if (matched) {
    activePath.value = matched.pagePath;
  }
}

function switchTab(pagePath: string) {
  if (activePath.value === pagePath) {
    return;
  }
  uni.switchTab({ url: `/${pagePath}` });
  activePath.value = pagePath;
}

function onRouteChanged() {
  refreshActivePath();
}

onMounted(() => {
  refreshActivePath();
  if (typeof window !== "undefined") {
    window.addEventListener("hashchange", onRouteChanged);
    window.addEventListener("popstate", onRouteChanged);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("hashchange", onRouteChanged);
    window.removeEventListener("popstate", onRouteChanged);
  }
});
</script>

<style scoped>
.custom-tabbar-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
  padding: 0 24rpx calc(12rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(238, 242, 247, 0) 0%, rgba(238, 242, 247, 0.95) 36%, #eef2f7 100%);
}

.custom-tabbar {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  gap: 10rpx;
  padding: 10rpx;
  border-radius: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.08);
}

.tab-item {
  height: 84rpx;
  border-radius: 22rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.tab-item-active {
  background: #0f172a;
}

.tab-icon {
  font-size: 26rpx;
  line-height: 1;
  color: #94a3b8;
}

.tab-icon-active {
  color: #34d399;
  font-weight: 700;
}

.tab-text {
  font-size: 22rpx;
  color: #64748b;
  line-height: 1;
}

.tab-text-active {
  color: #ffffff;
  font-weight: 700;
}

.theme-dark .custom-tabbar-wrap {
  background: linear-gradient(180deg, rgba(11, 16, 32, 0) 0%, rgba(11, 16, 32, 0.95) 36%, #0b1020 100%);
}

.theme-dark .custom-tabbar {
  background: #111827;
  border-color: rgba(255, 255, 255, 0.08);
}

.theme-dark .tab-item-active {
  background: #0f172a;
}

.theme-dark .tab-icon {
  color: #7b8aa1;
}

.theme-dark .tab-text {
  color: #98a5bb;
}
</style>
