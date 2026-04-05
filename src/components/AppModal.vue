<template>
  <view v-if="visible" class="modal-mask" @click="handleMaskClick">
    <view class="modal-panel" @click.stop>
      <view class="modal-title">{{ title }}</view>
      <view v-if="message" class="modal-message">{{ message }}</view>
      <input
        v-if="showInput"
        v-model="innerInput"
        class="modal-input"
        :placeholder="inputPlaceholder"
        maxlength="30"
      />
      <view class="modal-actions">
        <button class="modal-btn cancel-btn" @click="handleCancel">{{ cancelText }}</button>
        <button :class="['modal-btn', dangerConfirm ? 'danger-btn' : 'confirm-btn']" @click="handleConfirm">{{ confirmText }}</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title: string;
    message?: string;
    showInput?: boolean;
    inputPlaceholder?: string;
    initialInput?: string;
    confirmText?: string;
    cancelText?: string;
    dangerConfirm?: boolean;
    closeOnMask?: boolean;
  }>(),
  {
    message: "",
    showInput: false,
    inputPlaceholder: "请输入",
    initialInput: "",
    confirmText: "确定",
    cancelText: "取消",
    dangerConfirm: false,
    closeOnMask: true,
  }
);

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "confirm", value: string): void;
  (e: "cancel"): void;
}>();

const innerInput = ref("");

watch(
  () => props.visible,
  (show) => {
    if (show) {
      innerInput.value = props.initialInput || "";
    }
  },
  { immediate: true }
);

function close() {
  emit("update:visible", false);
}

function handleMaskClick() {
  if (!props.closeOnMask) {
    return;
  }
  emit("cancel");
  close();
}

function handleCancel() {
  emit("cancel");
  close();
}

function handleConfirm() {
  emit("confirm", innerInput.value);
  close();
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  box-sizing: border-box;
}

.modal-panel {
  width: 100%;
  max-width: 640rpx;
  background: #ffffff;
  border-radius: 26rpx;
  padding: 30rpx 24rpx 20rpx;
  box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.18);
}

.modal-title {
  text-align: center;
  font-size: 36rpx;
  font-weight: 700;
  color: #0f172a;
}

.modal-message {
  margin-top: 18rpx;
  font-size: 28rpx;
  color: #64748b;
  line-height: 1.5;
}

.modal-input {
  margin-top: 18rpx;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 16rpx;
  background: #f8fafc;
  height: 82rpx;
  padding: 0 20rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.modal-actions {
  margin-top: 24rpx;
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
  border: 1px solid transparent;
  padding: 0;
}

.cancel-btn {
  background: #e2e8f0;
  color: #334155;
  border-color: #d0d9e6;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);
}

.confirm-btn {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
  box-shadow: 0 8rpx 16rpx rgba(15, 23, 42, 0.2);
}

.danger-btn {
  background: #cf2f33;
  color: #ffffff;
  border-color: #cf2f33;
}
</style>
