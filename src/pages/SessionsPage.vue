<template>
  <q-page class="sessions">
    <h1 class="sessions__title">Sessions</h1>
    <p class="sessions__subtitle">Browse showtimes across all venues</p>

    <div class="sessions__layout">
      <SessionFilters
        :params="params"
        :active-count="activeFilterCount"
        class="sessions__sidebar"
        @change="setFilters"
        @clear="clearFilters"
      />

      <section class="sessions__list">
        <div class="sessions__header">
          <span class="sessions__count">{{
            isLoading || hasError ? "" : countLabel
          }}</span>

          <button type="button" class="sessions__sort">
            <span class="sessions__sort-label">Sort:</span>
            {{ sortLabel }}
            <AppIcon name="chevron-down" />

            <q-menu
              anchor="bottom right"
              self="top right"
              :offset="[0, 8]"
              class="sessions-sort-menu"
            >
              <button
                v-for="option in filterOptions.options?.sorts"
                :key="option.id"
                v-close-popup
                type="button"
                class="sessions-sort-menu__item"
                :class="{
                  'sessions-sort-menu__item--active': option.id === sort
                }"
                @click="setFilters({ sort: option.id })"
              >
                {{ option.label }}
              </button>
            </q-menu>
          </button>
        </div>

        <!-- Skeletons shaped like film groups, so the layout doesn't jump when the data arrives -->
        <div v-if="isLoading" class="sessions__groups" aria-busy="true">
          <div v-for="n in 3" :key="n" class="sessions__skeleton">
            <div class="sessions__skeleton-header">
              <q-skeleton dark width="56px" height="80px" />
              <q-skeleton dark type="text" width="200px" />
            </div>
            <div class="sessions__skeleton-row">
              <q-skeleton
                v-for="m in 5"
                :key="m"
                dark
                class="sessions__skeleton-card"
              />
            </div>
          </div>
        </div>

        <div v-else-if="hasError" class="sessions__message">
          <p>We couldn't load the sessions.</p>
          <q-btn
            unelevated
            rounded
            no-caps
            color="primary"
            label="Try again"
            @click="load(route.query)"
          />
        </div>

        <div v-else-if="!groups.length" class="sessions__message">
          <p
            >No sessions match these filters. Try another date or fewer
            filters.</p
          >
          <q-btn
            v-if="activeFilterCount"
            unelevated
            rounded
            no-caps
            color="primary"
            label="Clear All Filters"
            @click="clearFilters"
          />
        </div>

        <template v-else>
          <div class="sessions__groups">
            <MovieGroup
              v-for="group in groups"
              :key="group.movie.id"
              :group="group"
              @select="session => selectSession(group.movie.slug, session)"
            />
          </div>

          <!-- Pages count films (10 per page), not sessions; one page needs no pager -->
          <AppPagination
            v-if="meta && meta.lastPage > 1"
            :page="meta.currentPage"
            :last-page="meta.lastPage"
            class="sessions__pagination"
            @update:page="setPage"
          />
        </template>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  onBeforeRouteUpdate,
  useRoute,
  useRouter,
  type LocationQuery,
  type LocationQueryRaw
} from "vue-router";

import { fetchSessions, type SessionsParams } from "@/api/sessions";
import type {
  MovieSessions,
  Session,
  SessionsMeta
} from "@/api/resources/Session";
import MovieGroup from "@/components/sessions/MovieGroup.vue";
import SessionFilters from "@/components/sessions/SessionFilters.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import AppPagination from "@/components/ui/AppPagination.vue";
import useFilterOptionsStore from "@/stores/useFilterOptionsStore";

const route = useRoute();
const router = useRouter();
const filterOptions = useFilterOptionsStore();

const groups = ref<MovieSessions[]>([]);
const meta = ref<SessionsMeta | null>(null);
const isLoading = ref(true);
const hasError = ref(false);

const toText = (value: unknown) =>
  typeof value === "string" && value ? value : undefined;

const toList = (value: unknown) => toText(value)?.split(",") ?? [];

const toParams = (query: LocationQuery): SessionsParams => ({
  date: toText(query.date),
  venues: toList(query.venue),
  formats: toList(query.format),
  languages: toList(query.language),
  bands: toList(query.time),
  sort: toText(query.sort),
  page: Number(query.page) || 1
});

// The current URL's filters, for the sidebar and the header
const params = computed(() => toParams(route.query));

// ---- Fetching ----

// Filters can change faster than responses come back; only the latest request may write the result
let lastRequest = 0;

const load = async (query: LocationQuery) => {
  const request = ++lastRequest;
  isLoading.value = true;
  hasError.value = false;

  try {
    // Normally loaded at boot; if that failed, Try again retries it here too
    if (!filterOptions.options) await filterOptions.load();

    const response = await fetchSessions(toParams(query));
    if (request !== lastRequest) return;

    groups.value = response.data;
    meta.value = response.meta;
  } catch {
    if (request === lastRequest) hasError.value = true;
  } finally {
    if (request === lastRequest) isLoading.value = false;
  }
};

onMounted(() => load(route.query));

// Fires when only the query changes (filters, sort, page, Back/Forward), not when leaving the page
onBeforeRouteUpdate(to => {
  void load(to.query);
});

// ---- API params -> URL ----

// Every change is a new history entry, so Back restores the previous filters.
// Any filter or sort change drops `page`, so the user lands on page 1, not an empty page 4.
// vue-router leaves `undefined` keys out of the URL, so empty filters disappear from it
const setFilters = (changes: Record<string, string | string[]>) => {
  const query: LocationQueryRaw = { ...route.query, page: undefined };

  Object.entries(changes).forEach(([key, value]) => {
    const text = Array.isArray(value) ? value.join(",") : value;
    query[key] = text || undefined;
  });

  void router.push({ query });
};

// Only the page changes; filters and sort stay. Page 1 is the default, so it's left out of the URL
const setPage = (page: number) => {
  void router.push({
    query: { ...route.query, page: page > 1 ? String(page) : undefined }
  });
};

// "Clear All Filters" keeps the date (spec 3.1)
const clearFilters = () =>
  setFilters({ venue: [], format: [], language: [], time: [] });

// ---- Session click ----

// A session opens its film's page, which then opens the seat selection modal by itself.
// `date` shows the session's day there; `session` says which session to open
const selectSession = (slug: string, session: Session) => {
  void router.push({
    name: "movie",
    params: { slug },
    query: { date: session.date, session: String(session.id) }
  });
};

// ---- Header ----

// Every ticked checkbox counts; the date is always set, so it isn't a filter here
const activeFilterCount = computed(() => {
  const { venues, formats, languages, bands } = params.value;
  return venues.length + formats.length + languages.length + bands.length;
});

const countLabel = computed(() => {
  const total = meta.value?.totalSessions ?? 0;
  if (!total) return "No sessions found";
  return `Showing ${total} ${total === 1 ? "session" : "sessions"}`;
});

// The API's default sort is the first option it lists
const sort = computed(
  () => toText(route.query.sort) ?? filterOptions.options?.sorts[0]?.id
);

const sortLabel = computed(
  () =>
    filterOptions.options?.sorts.find(option => option.id === sort.value)?.label
);
</script>

<style lang="scss">
// QMenu teleports to <body>, so its own box can't be styled from the scoped block
.q-menu.sessions-sort-menu {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
  border-radius: 12px;
  background: $bg-card;
  color: $text-primary;
}

.sessions-sort-menu__item {
  padding: 10px 16px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: $tint-white;
    outline: none;
  }

  &--active {
    color: $color-red;
  }
}
</style>

<style scoped lang="scss">
.sessions {
  padding: 116px 50px 60px;
  color: $text-primary;
}

.sessions__title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
}

.sessions__subtitle {
  margin: 0 0 32px;
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.3;
}

// align-items: start keeps the sidebar its own height, which sticky needs to work
.sessions__layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 50px;
  align-items: start;
}

.sessions__sidebar {
  position: sticky;
  top: 24px;
}

.sessions__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.sessions__count {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.sessions__sort {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 0;
  border: 0;
  background: none;
  color: $text-primary;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

.sessions__sort-label {
  color: $text-secondary;
  font-weight: 400;
  line-height: 1.3;
}

// Film groups are split by a line with 32px on both sides (Figma)
.sessions__groups > * + * {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid $tint-white;
}

.sessions__pagination {
  margin-top: 48px;
}

// Skeletons copy the film group's shape: poster + title, then a row of 252x104 cards
.sessions__skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sessions__skeleton-header {
  display: flex;
  gap: 16px;
  align-items: center;
}

.sessions__skeleton-row {
  display: flex;
  gap: 12px;
  overflow: hidden;
}

.sessions__skeleton-card {
  flex: 0 0 252px;
  height: 104px;
  border-radius: 16px;
}

.sessions__message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
  color: $text-secondary;
  font-size: 16px;

  p {
    margin: 0;
  }
}
</style>
