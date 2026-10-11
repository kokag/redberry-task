<template>
  <nav class="pagination" aria-label="Pagination">
    <div class="pagination__buttons">
      <button
        type="button"
        class="pagination__button pagination__button--arrow"
        :disabled="page <= 1"
        aria-label="Previous page"
        @click="emit('update:page', page - 1)"
      >
        <AppIcon name="chevron-down" class="pagination__chevron--left" />
      </button>

      <template v-for="(item, index) in items" :key="index">
        <span v-if="item === '…'" class="pagination__gap">…</span>
        <button
          v-else
          type="button"
          class="pagination__button"
          :class="{ 'pagination__button--active': item === page }"
          :aria-current="item === page ? 'page' : undefined"
          @click="emit('update:page', item)"
        >
          {{ item }}
        </button>
      </template>

      <button
        type="button"
        class="pagination__button pagination__button--arrow"
        :disabled="page >= lastPage"
        aria-label="Next page"
        @click="emit('update:page', page + 1)"
      >
        <AppIcon name="chevron-down" class="pagination__chevron--right" />
      </button>
    </div>

    <!-- The brief asks for a current/total display next to the page numbers -->
    <span class="pagination__status">Page {{ page }} of {{ lastPage }}</span>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";

const props = defineProps<{
  page: number;
  lastPage: number;
}>();

const emit = defineEmits<{
  "update:page": [page: number];
}>();

// First, last, and the pages next to the current one; any skipped run becomes "…".
// Page 5 of 10 -> 1 … 4 5 6 … 10
const items = computed(() => {
  const result: (number | "…")[] = [];

  for (let item = 1; item <= props.lastPage; item++) {
    const isEdge = item === 1 || item === props.lastPage;
    const isNear = Math.abs(item - props.page) <= 1;

    if (isEdge || isNear) result.push(item);
    else if (result.at(-1) !== "…") result.push("…");
  }

  return result;
});
</script>

<style scoped lang="scss">
// Sizes from the Figma "Pagination" component: 40px round buttons, 8px apart
.pagination {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.pagination__buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination__button,
.pagination__gap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: $text-secondary;
  font-size: 16px;
  line-height: 1;
}

.pagination__button {
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: none;
  font-family: inherit;
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    background: $tint-white;
    outline: none;
  }

  &--arrow {
    background: $bg-card;
  }

  &--active,
  &--active:hover:not(:disabled) {
    background: $color-red;
    color: $text-primary;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

// One chevron icon, turned to point left or right
.pagination__chevron--left {
  transform: rotate(90deg);
}

.pagination__chevron--right {
  transform: rotate(-90deg);
}

.pagination__status {
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}
</style>
