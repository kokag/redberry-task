<template>
  <div ref="root" class="search">
    <label class="search__bar" :class="{ 'search__bar--open': isOpen, 'search__bar--empty': !query }">
      <q-icon v-if="!isOpen || query" name="search" size="16px" />
      <input
        v-model="query"
        type="search"
        placeholder="Search films and live events"
        aria-label="Search films and live events"
        class="search__input"
        @focus="isOpen = true"
        @click="isOpen = true"
        @input="isOpen = true"
        @keydown.esc.prevent="close"
      />
      <button
        v-if="isOpen && query"
        type="button"
        class="search__clear"
        aria-label="Clear search"
        @click="clear"
      >
        <AppIcon name="close" :size="16" />
      </button>
    </label>

    <div v-if="isOpen" class="search__panel">
      <div v-if="!query.trim()" class="search__empty">
        <span class="search__badge"><AppIcon name="popcorn" :size="24" /></span>
        <p class="search__empty-title">What do you want to watch?</p>
        <p class="search__empty-text">Search by title, director or cast</p>
        <router-link :to="{ name: 'sessions' }" class="search__btn" @click="clear">Browse all sessions</router-link>
      </div>

      <div v-else-if="hasError" class="search__empty">
        <p class="search__empty-title">We couldn't load search results.</p>
        <button type="button" class="search__btn" @click="search">Try again</button>
      </div>

      <div v-else-if="isLoading && !results.length" class="search__empty">
        <q-spinner size="32px" />
      </div>

      <template v-else-if="results.length">
        <div class="search__header">
          <span class="search__label">Films & Events</span>
          <span class="search__count">
            {{ results.length }} {{ results.length === 1 ? "result" : "results" }}
          </span>
        </div>

        <div class="search__list">
          <router-link
            v-for="movie in results"
            :key="movie.id"
            :to="{ name: 'movie', params: { slug: movie.slug } }"
            class="search__result"
            @click="clear"
          >
            <img :src="movie.posterUrl ?? undefined" alt="" class="search__poster" />

            <div class="search__info">
              <p class="search__title">
                <span
                  v-for="(part, index) in splitTitle(movie.title)"
                  :key="index"
                  :class="{ 'search__match': index === 1 }"
                >{{ part }}</span>
              </p>
              <p class="search__meta">
                {{ movie.kind === "film" ? "Film" : "Event" }} · {{ movie.ageRating.code }} ·
                {{ movie.runtimeMinutes }} min
              </p>
            </div>

            <span v-if="movie.isComingSoon" class="search__price search__price--soon">Coming Soon</span>
            <span v-else class="search__price">from ₾{{ movie.fromPrice }}</span>
          </router-link>
        </div>
      </template>

      <div v-else class="search__empty">
        <span class="search__badge"><AppIcon name="magnifying-glass" :size="20" /></span>
        <p class="search__empty-title">No results for “{{ query.trim() }}”</p>
        <p class="search__empty-text">Check the spelling or try another film or live event.</p>
        <router-link :to="{ name: 'sessions' }" class="search__btn" @click="clear">Browse all sessions</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { searchMovies } from "@/api/movies";
import type { Movie } from "@/api/resources/Movie";
import AppIcon from "@/components/ui/AppIcon.vue";

const root = ref<HTMLElement | null>(null);
const query = ref("");
const results = ref<Movie[]>([]);
const isOpen = ref(false);
const isLoading = ref(false);
const hasError = ref(false);

const search = async () => {
  const q = query.value.trim();
  isLoading.value = true;
  hasError.value = false;

  try {
    const data = await searchMovies(q);
    // Ignore an older, slower response once the user has typed something else
    if (q === query.value.trim()) results.value = data;
  } catch {
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};

// The API asks for a debounce, so we only search once the user stops typing for 300ms
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

watch(query, (value) => {
  clearTimeout(debounceTimer);

  if (!value.trim()) {
    results.value = [];
    return;
  }

  // Set right away so "No results" doesn't flash while we wait for the debounce
  isLoading.value = true;
  debounceTimer = setTimeout(search, 300);
});

const close = () => {
  isOpen.value = false;
};

// The clear button and every link close the overlay (Figma "Close overlay")
const clear = () => {
  query.value = "";
  close();
};

// "The Odyssey" + "the" -> ["", "The", " Odyssey"]; the middle part is shown highlighted
const splitTitle = (title: string) => {
  const q = query.value.trim();
  const start = title.toLowerCase().indexOf(q.toLowerCase());
  if (start === -1) return [title];

  return [title.slice(0, start), title.slice(start, start + q.length), title.slice(start + q.length)];
};

// Clicking anywhere outside the search closes it
const onPointerDown = (event: PointerEvent) => {
  if (!root.value?.contains(event.target as Node)) close();
};

onMounted(() => document.addEventListener("pointerdown", onPointerDown));
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDown);
  clearTimeout(debounceTimer);
});
</script>

<style scoped lang="scss">
// Sizes from the Figma "Search" component and the "Overlay / Search" frames
.search {
  position: relative;
}

// Default 380px; while open it grows to 480px. The navbar is right-aligned, so it grows to the left
.search__bar {
  display: flex;
  gap: 4px;
  align-items: center;
  width: 380px;
  height: 41px;
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: $tint-white;
  cursor: text;

  &:hover {
    border-color: $tint-white;
  }

  &--open {
    width: 480px;
    padding-right: 8px;
    border-color: $tint-white;
    backdrop-filter: blur(14px);
  }

  // Focused and still empty: no icon, the placeholder is dimmed
  &--open.search__bar--empty {
    padding-left: 22px;
  }
}

.search__input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: none;
  color: $text-primary;
  font: inherit;
  font-size: 14px;
  line-height: 1.3;

  &::placeholder {
    color: $text-primary;
    opacity: 1;
  }

  .search__bar--open &::placeholder {
    color: $text-disabled;
  }

  // Our own clear button replaces the browser's
  &::-webkit-search-cancel-button {
    display: none;
  }
}

.search__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: $tint-white;
  color: $text-primary;
  cursor: pointer;
}

.search__panel {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  width: 480px;
  padding: 8px;
  border: 1px solid $bg-raised;
  border-radius: 16px;
  background: $bg-page;
  box-shadow:
    0 20px 48px -8px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.2);
}

// Prompt, no results, loading and error all share this centered layout
.search__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 32px 24px 28px;
  text-align: center;

  p {
    margin: 0;
  }
}

.search__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 14px;
  border-radius: 999px;
  background: $tint-white;
}

.search__empty-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.search__empty-text {
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.3;
}

.search__btn {
  margin-top: 16px;
  padding: 13px 22px;
  border: 0;
  border-radius: 999px;
  background: $tint-white;
  color: $text-primary;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
}

.search__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 6px;
}

.search__label {
  color: $text-secondary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.search__count {
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.search__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.search__result {
  display: flex;
  gap: 14px;
  align-items: center;
  height: 72px;
  padding: 8px 20px 8px 10px;
  border-radius: 10px;
  color: $text-primary;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    background: $tint-white;
  }
}

.search__poster {
  width: 40px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 6px;
  background: $bg-raised;
  object-fit: cover;
}

.search__info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;

  p {
    margin: 0;
  }
}

.search__title {
  overflow: hidden;
  color: $text-secondary;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search__match {
  color: $text-primary;
}

.search__meta {
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.search__price {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;

  &--soon {
    color: $color-orange;
  }
}
</style>
