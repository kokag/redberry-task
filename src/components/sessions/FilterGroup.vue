<template>
  <!-- role="group" + aria-label: screen readers announce "Venue, group" like a fieldset would -->
  <div class="filter-group" role="group" :aria-label="title">
    <span class="filter-group__title" aria-hidden="true">{{ title }}</span>

    <label
      v-for="option in options"
      :key="option.value"
      class="filter-group__option"
    >
      <!-- The real checkbox stays in the DOM for keyboard and screen readers; the icon is what's seen -->
      <input
        type="checkbox"
        class="filter-group__input"
        :checked="selected.includes(option.value)"
        @change="emit('toggle', option.value)"
      />
      <AppIcon
        :name="
          selected.includes(option.value) ? 'checkbox-checked' : 'checkbox'
        "
        :size="18"
        class="filter-group__box"
      />
      <span>
        {{ option.label }}
        <span v-if="option.detail" class="filter-group__detail"
          >· {{ option.detail }}</span
        >
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import AppIcon from "@/components/ui/AppIcon.vue";

export interface FilterOption {
  value: string;
  label: string;
  detail?: string | undefined;
}

defineProps<{
  title: string;
  options: FilterOption[];
  selected: string[];
}>();

const emit = defineEmits<{
  toggle: [value: string];
}>();
</script>

<style scoped lang="scss">
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-group__title {
  color: $text-secondary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.filter-group__option {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}

// Hidden visually but still focusable and announced
.filter-group__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.filter-group__box {
  border-radius: 5px;

  .filter-group__input:focus-visible + & {
    outline: 2px solid $text-primary;
    outline-offset: 2px;
  }
}

.filter-group__detail {
  color: $text-secondary;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.3;
}
</style>
