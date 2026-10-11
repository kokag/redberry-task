<template>
  <div class="date-picker" :class="{ 'date-picker--large': large }">
    <button
      v-for="day in days"
      :key="day.value"
      type="button"
      class="date-picker__day"
      :class="{ 'date-picker__day--selected': day.value === modelValue }"
      :disabled="availableDates && !availableDates.includes(day.value)"
      :aria-pressed="day.value === modelValue"
      :aria-label="day.label"
      @click="emit('update:modelValue', day.value)"
    >
      <span>{{ day.weekday }}</span>
      <span>{{ day.date }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { toDateString } from "@/utils/date";

defineProps<{
  modelValue: string;
  // Days missing from this list are disabled (the film page passes the movie's availableDates)
  availableDates?: string[];
  // The film page uses the big 80x80 days
  large?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// The spec's picker always covers today and the 6 days after it
const DAY_COUNT = 7;

const days = Array.from({ length: DAY_COUNT }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);

  return {
    value: toDateString(date),
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    date: date.getDate(),
    // Read out in full by screen readers: "Thursday, October 8"
    label: date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    })
  };
});
</script>

<style scoped lang="scss">
// Sizes from the Figma "Days" component (Days_Small variant).
// Seven 37px days don't fit the 272px sidebar, so the row scrolls like in the design
.date-picker {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-color: $bg-raised transparent;
  scrollbar-width: thin;
}

.date-picker__day {
  display: flex;
  flex: 0 0 37px;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  height: 54px;
  padding: 10px 6px;
  border: 0;
  border-radius: 8px;
  background: $bg-raised;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  color: $text-primary;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid $text-primary;
    outline-offset: -2px;
  }

  &--selected {
    background: $color-red;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

// Figma "Days" (Default variant): 80x80, radius 16, weekday Label/S over the date in H3
.date-picker--large {
  flex-wrap: wrap;
  gap: 10px;
  overflow: visible;
  padding-bottom: 0;

  .date-picker__day {
    flex-basis: 80px;
    justify-content: center;
    gap: 7px;
    height: 80px;
    border-radius: 16px;
    background: $bg-card;

    span:last-child {
      font-size: 18px;
      font-weight: 800;
    }
  }

  .date-picker__day--selected {
    background: $color-red;
  }
}
</style>
