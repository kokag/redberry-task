<template>
  <!-- The modal card; put it inside a <q-dialog>. Must stay a <div>: Quasar only allows clicks on `.q-dialog__inner > div` -->
  <div class="app-modal-card">
    <header class="app-modal-card__header">
      <div class="app-modal-card__heading">
        <h2 class="app-modal-card__title">{{ title }}</h2>
        <p v-if="subtitle" class="app-modal-card__subtitle">{{ subtitle }}</p>
      </div>

      <button
        v-close-popup
        type="button"
        class="app-modal-card__close"
        aria-label="Close"
      >
        <AppIcon name="close" :size="24" />
      </button>
    </header>

    <slot />
  </div>
</template>

<script setup lang="ts">
import AppIcon from "@/components/ui/AppIcon.vue";

defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<style scoped lang="scss">
.app-modal-card {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 403px;
  padding: 32px;
  border: 1px solid $bg-raised;
  border-radius: 28px;
  background: $bg-page;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.2);
  color: $text-primary;
}

.app-modal-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.app-modal-card__heading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-modal-card__title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: normal;
}

.app-modal-card__subtitle {
  margin: 0;
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.app-modal-card__close {
  display: flex;
  padding: 0;
  border: 0;
  background: none;
  color: $text-primary;
  cursor: pointer;
}
</style>
