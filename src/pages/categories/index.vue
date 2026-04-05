<template>
  <view class="page-wrap">
    <view>
      <view class="page-title">分类管理</view>
      <view class="page-subtitle">管理分类与迁移</view>
    </view>

    <view class="card">
      <view class="field-label">新增分类名称</view>
      <input v-model="newName" class="input" placeholder="请输入分类名称" />
      <button class="primary-btn create-btn" @click="handleAdd">+ 新增分类</button>
    </view>

    <view v-for="category in categories" :key="category.id" class="card">
      <view class="line">
        <view class="category-link" @click="goItemsByCategory(category)">{{ category.name }}</view>
        <view>{{ countItems(category.id) }} 项</view>
      </view>
      <view class="row">
        <button class="action-btn" @click="handleRename(category.id)">重命名</button>
        <button class="action-btn" @click="handleMigrate(category.id)">迁移到其他分类</button>
        <button class="action-btn danger-btn" @click="handleDelete(category.id)">删除</button>
      </view>
    </view>

    <AppModal
      v-model:visible="renameModalVisible"
      title="重命名"
      :showInput="true"
      input-placeholder="输入新名称"
      :initial-input="renameInitialName"
      @confirm="confirmRename"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { addCategory, deleteCategory, listCategories, listItems, migrateCategory, renameCategory } from "@/services/appService";
import type { Category } from "@/types";
import AppModal from "@/components/AppModal.vue";

const categories = ref<Category[]>([]);
const newName = ref("");
const renameModalVisible = ref(false);
const renameTargetId = ref("");
const renameInitialName = ref("");

onShow(refresh);

function refresh() {
  categories.value = listCategories();
}

function countItems(categoryId: string): number {
  return listItems({ categoryId }).length;
}

function handleAdd() {
  if (!newName.value.trim()) {
    uni.showToast({ title: "请输入分类名称", icon: "none" });
    return;
  }
  try {
    addCategory(newName.value);
    newName.value = "";
    refresh();
  } catch (err) {
    uni.showToast({ title: (err as Error).message, icon: "none" });
  }
}

function handleRename(id: string) {
  renameTargetId.value = id;
  renameInitialName.value = categories.value.find((item) => item.id === id)?.name || "";
  renameModalVisible.value = true;
}

function confirmRename(inputValue: string) {
  const name = (inputValue || "").trim();
  if (!name || !renameTargetId.value) {
    return;
  }
  try {
    renameCategory(renameTargetId.value, name);
    refresh();
  } catch (err) {
    uni.showToast({ title: (err as Error).message, icon: "none" });
  }
}

function handleMigrate(fromId: string) {
  const targets = categories.value.filter((item) => item.id !== fromId);
  if (!targets.length) {
    uni.showToast({ title: "至少需要两个分类", icon: "none" });
    return;
  }
  uni.showActionSheet({
    itemList: targets.map((item) => item.name),
    success: (res) => {
      const target = targets[res.tapIndex];
      if (!target) {
        return;
      }
      migrateCategory(fromId, target.id);
      uni.showToast({ title: `已迁移到${target.name}`, icon: "none" });
      refresh();
    },
  });
}

function handleDelete(id: string) {
  try {
    deleteCategory(id);
    refresh();
  } catch (err) {
    uni.showToast({ title: (err as Error).message, icon: "none" });
  }
}

function goItemsByCategory(category: Category) {
  uni.setStorageSync("writedown_items_category_filter", JSON.stringify({
    categoryId: category.id,
    categoryName: category.name,
  }));
  uni.switchTab({ url: "/pages/items/index" });
}
</script>

<style scoped>
.field-label {
  margin-bottom: 10rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
}

.input {
  height: 88rpx;
  line-height: 88rpx;
  border: 1px solid #c7d2e5;
  border-radius: 20rpx;
  padding: 0 22rpx;
  margin-bottom: 14rpx;
  background: #f8fafc;
  font-size: 28rpx;
  color: #0f172a;
}

.create-btn {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
  box-shadow: 0 10rpx 20rpx rgba(15, 23, 42, 0.2);
}

.line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14rpx;
  font-size: 36rpx;
  font-weight: 600;
}

.category-link {
  cursor: pointer;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: 12rpx;
}

.action-btn {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 26rpx;
  font-weight: 600;
  border-radius: 999rpx;
  border: 1px solid rgba(15, 23, 42, 0.12);
}
</style>
