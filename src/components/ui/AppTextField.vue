<template>
  <div
    class="text-field"
    :class="{
      'text-field--invalid': error,
      'text-field--valid': valid && !error
    }"
  >
    <label :for="inputId" class="text-field__label">{{ label }}</label>

    <div class="text-field__control">
      <input
        :id="inputId"
        v-model="value"
        :type="type"
        :name="name"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? errorId : undefined"
        class="text-field__input"
        @blur="emit('blur')"
      />

      <AppIcon v-if="error" name="alert-circle" class="text-field__icon" />
      <AppIcon v-else-if="valid" name="check" class="text-field__icon" />
    </div>

    <span v-if="error" :id="errorId" class="text-field__error">{{
      error
    }}</span>
  </div>
</template>

<script setup lang="ts">
import { useId } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";

withDefaults(
  defineProps<{
    label: string;
    type?: string;
    name?: string;
    placeholder?: string;
    autocomplete?: string;
    error?: string | null;
    valid?: boolean;
  }>(),
  { type: "text" }
);

const emit = defineEmits<{
  blur: [];
}>();

const value = defineModel<string>({ default: "" });

const inputId = useId();
const errorId = useId();
</script>

<style scoped lang="scss">
.text-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.text-field__label,
.text-field__input,
.text-field__error {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.text-field__label {
  // 10px from the input in Figma; the column gap gives 8
  margin-bottom: 2px;
  color: $text-primary;
}

.text-field__control {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: $bg-card;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: $text-disabled;
  }
}

.text-field__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: none;
  background: none;
  color: $text-primary;
  font-family: inherit;

  &::placeholder {
    color: $text-secondary;
    opacity: 1;
  }
}

.text-field__error {
  color: $color-red;
}

.text-field--valid .text-field__icon {
  color: $color-green;
}

.text-field--invalid {
  .text-field__label,
  .text-field__input,
  .text-field__icon {
    color: $color-red;
  }

  .text-field__control {
    border-color: $color-red;
  }
}
</style>
