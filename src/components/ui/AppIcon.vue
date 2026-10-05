<template>
  <span
    class="app-icon"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
    v-html="icons[name]"
  />
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string;
    size?: number;
  }>(),
  { size: 16 }
);

// Inlined (not <img>) so the icons pick up `currentColor` from the surrounding text.
// v-html is safe here: the markup only ever comes from our own src/assets/icons
const files = import.meta.glob<string>("@/assets/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true
});

// "/src/assets/icons/ticket.svg" -> "ticket"
const icons = Object.fromEntries(
  Object.entries(files).map(([path, svg]) => [
    path.slice(path.lastIndexOf("/") + 1, -".svg".length),
    svg
  ])
);
</script>

<style scoped lang="scss">
.app-icon {
  display: inline-flex;
  flex-shrink: 0;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}
</style>
