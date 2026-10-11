<template>
  <aside class="filters">
    <h2 class="filters__title">Filters</h2>

    <template v-if="options">
      <FilterGroup
        title="Venue"
        :options="
          options.venues.map(venue => ({
            value: venue.slug,
            label: venue.name,
            detail: venue.city
          }))
        "
        :selected="params.venues"
        class="filters__section"
        @toggle="toggleVenue"
      />

      <div class="filters__section filters__date">
        <span class="filters__label">Date</span>
        <!-- No date in the URL means today (spec: default is today) -->
        <DatePicker
          :model-value="params.date ?? today()"
          @update:model-value="date => emit('change', { date })"
        />
      </div>

      <FilterGroup
        title="Format"
        :options="
          availableFormats.map(format => ({
            value: format.slug,
            label: format.name
          }))
        "
        :selected="params.formats"
        class="filters__section"
        @toggle="
          slug => emit('change', { format: toggle(params.formats, slug) })
        "
      />

      <FilterGroup
        title="Language"
        :options="
          options.languages.map(language => ({
            value: language.slug,
            label: language.name
          }))
        "
        :selected="params.languages"
        class="filters__section"
        @toggle="
          slug => emit('change', { language: toggle(params.languages, slug) })
        "
      />

      <FilterGroup
        title="Time of Day"
        :options="
          options.timeBands.map(band => ({
            value: band.id,
            ...splitLabel(band.label)
          }))
        "
        :selected="params.bands"
        class="filters__section"
        @toggle="id => emit('change', { time: toggle(params.bands, id) })"
      />
    </template>

    <div class="filters__section filters__footer">
      <button
        v-if="activeCount"
        type="button"
        class="filters__clear"
        @click="emit('clear')"
      >
        Clear All Filters
      </button>
      <span class="filters__count">
        {{ activeCount }} {{ activeCount === 1 ? "filter" : "filters" }} active
      </span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";

import type { SessionsParams } from "@/api/sessions";
import DatePicker from "@/components/ui/DatePicker.vue";
import FilterGroup from "@/components/sessions/FilterGroup.vue";
import useFilterOptionsStore from "@/stores/useFilterOptionsStore";
import { today } from "@/utils/date";

const props = defineProps<{
  params: SessionsParams;
  activeCount: number;
}>();

// Keys are the URL query keys; the page writes them into the URL
const emit = defineEmits<{
  change: [changes: Record<string, string | string[]>];
  clear: [];
}>();

const { options } = storeToRefs(useFilterOptionsStore());

// Adds the value if it's missing, removes it if it's there
const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter(item => item !== value) : [...list, value];

// "Morning (before 12:00)" from the API -> "Morning" with "before 12:00" in grey, like the design
const splitLabel = (text: string) => {
  const [label = text, detail] = text.split(" (");
  return { label, detail: detail?.replace(")", "") };
};

// With venues selected, only the formats those venues have; with none, all of them
const formatsFor = (venues: string[]) => {
  if (!options.value) return [];
  if (!venues.length) return options.value.formats;

  const slugs = options.value.venues
    .filter(venue => venues.includes(venue.slug))
    .flatMap(venue => venue.formats.map(format => format.slug));

  return options.value.formats.filter(format => slugs.includes(format.slug));
};

const availableFormats = computed(() => formatsFor(props.params.venues));

// A selected format the new venues don't have is dropped too, so the URL never holds a hidden filter
const toggleVenue = (slug: string) => {
  const venues = toggle(props.params.venues, slug);
  const formats = formatsFor(venues).map(format => format.slug);

  emit("change", {
    venue: venues,
    format: props.params.formats.filter(format => formats.includes(format))
  });
};
</script>

<style scoped lang="scss">
// Sizes from the Figma "Filter sidebar" frame
.filters {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  border-radius: 16px;
  background: $bg-card;
}

.filters__title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
}

// A divider above every section except the first one after the title
.filters__section + .filters__section {
  padding-top: 24px;
  border-top: 1px solid $tint-white;
}

.filters__date {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// Same overline as the FilterGroup titles
.filters__label {
  color: $text-secondary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.filters__footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.filters__clear {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid $text-secondary;
  border-radius: 999px;
  background: none;
  color: $text-primary;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: $tint-white;
    outline: none;
  }
}

.filters__count {
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}
</style>
