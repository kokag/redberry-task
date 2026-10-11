<template>
  <aside class="details">
    <h2 class="details__title">Details</h2>

    <!-- Rows without a value (e.g. no director for an event) are left out -->
    <div
      v-for="row in rows.filter(row => row.value)"
      :key="row.label"
      class="details__row"
    >
      <span class="details__label">{{ row.label }}</span>
      <span class="details__value">{{ row.value }}</span>
    </div>

    <div class="details__note">
      <span class="details__note-title">Rating note</span>
      <p class="details__note-text">
        <strong>{{ movie.ageRating.code }}</strong>
        {{ movie.ageRating.description }}
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { MovieDetail } from "@/api/resources/Movie";
import { formatDay } from "@/utils/date";

const props = defineProps<{
  movie: MovieDetail;
}>();

const rows = computed(() => [
  { label: "Director", value: props.movie.director },
  { label: "Main cast", value: props.movie.cast },
  // Not in the Figma, but the spec lists genre among the details
  {
    label: "Genre",
    value: props.movie.genres.map(genre => genre.name).join(", ")
  },
  { label: "Duration", value: `${props.movie.runtimeMinutes} minutes` },
  { label: "Release date", value: formatDay(props.movie.releaseDate, "D MMMM YYYY") },
  {
    label: "Formats",
    value: props.movie.formats.map(format => format.name).join(", ")
  },
  { label: "From", value: `₾${props.movie.fromPrice}` }
]);
</script>

<style scoped lang="scss">
.details {
  display: flex;
  flex-direction: column;
  gap: 17px;
  padding: 0 26px;
  color: $text-primary;
}

.details__title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.details__row {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.details__label {
  color: $text-secondary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
}

.details__value {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.details__note {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 9px 13px;
  border-radius: 12px;
  background: $tint-orange;
  color: $color-orange;
}

.details__note-title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
}

.details__note-text {
  display: flex;
  gap: 7px;
  margin: 0;
  font-size: 12px;
  line-height: 1.3;

  strong {
    flex-shrink: 0;
    font-weight: 600;
  }
}
</style>
