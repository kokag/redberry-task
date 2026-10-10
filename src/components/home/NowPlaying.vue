<template>
  <section class="now-playing">
    <div class="now-playing__header">
      <h2 class="now-playing__title">Now Playing</h2>
      <router-link :to="{ name: 'sessions' }" class="now-playing__see-all">See all</router-link>
    </div>

    <div v-if="isLoading" class="now-playing__row" aria-busy="true">
      <q-skeleton v-for="n in 6" :key="n" dark class="now-playing__card" height="452px" />
    </div>

    <div v-else-if="hasError" class="now-playing__message">
      <p>We couldn't load the films that are showing.</p>
      <q-btn unelevated rounded no-caps color="primary" label="Try again" @click="fetchMovies" />
    </div>

    <p v-else-if="!movies.length" class="now-playing__message">
      No films are showing right now. Check back soon.
    </p>

    <div v-else class="now-playing__row">
      <!-- Only "Buy Ticket" opens the film page; the card itself isn't clickable -->
      <article v-for="movie in movies" :key="movie.id" class="now-playing__card">
        <img :src="movie.posterUrl ?? undefined" :alt="movie.title" class="now-playing__poster" />

        <div class="now-playing__info">
          <h3 class="now-playing__name">{{ movie.title }}</h3>
          <p class="now-playing__meta">
            {{ movie.genres[0]?.name }} · {{ movie.runtimeMinutes }} min
          </p>
          <span class="now-playing__rating">{{ movie.ageRating.code }}</span>
          <!-- Only shown while the card is hovered (Figma "Hover" variant) -->
          <p class="now-playing__synopsis">{{ movie.synopsis }}</p>
        </div>

        <div class="now-playing__footer">
          <span class="now-playing__price">From ₾ {{ movie.fromPrice }}</span>
          <q-btn
            unelevated
            rounded
            no-caps
            color="primary"
            label="Buy Ticket"
            class="now-playing__btn"
            :to="{ name: 'movie', params: { slug: movie.slug } }"
          />
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import { fetchNowPlaying } from "@/api/movies";
import type { MovieWithSynopsis } from "@/api/resources/Movie";

const movies = ref<MovieWithSynopsis[]>([]);
const isLoading = ref(true);
const hasError = ref(false);

const fetchMovies = async () => {
  isLoading.value = true;
  hasError.value = false;

  try {
    movies.value = await fetchNowPlaying(10);
  } catch {
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchMovies);
</script>

<style scoped lang="scss">
// Sizes from the Figma "Card_big" component and the Now Playing frame
.now-playing {
  padding: 0 70px;
  color: $text-primary;
}

.now-playing__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.now-playing__title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
}

.now-playing__see-all {
  color: $color-red;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  text-decoration: none;
}

// Cards scroll sideways; the last one is cut off at the edge like in the design
.now-playing__row {
  display: flex;
  gap: 17px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-color: $bg-raised transparent;
  scrollbar-width: thin;
}

// Hover (Figma "Hover" variant, smart animate 300ms linear): the card widens 260 -> 447,
// the poster gets shorter and the synopsis appears. The height stays 452, so the row doesn't jump.
// :focus-within gives keyboard users the same preview when they tab to "Buy Ticket".
.now-playing__card {
  position: relative;
  display: flex;
  flex: 0 0 260px;
  flex-direction: column;
  gap: 10px;
  height: 452px;
  padding: 12px;
  border-radius: 20px;
  overflow: hidden;
  background: $bg-card;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  transition: flex-basis 300ms linear;

  &:hover,
  &:focus-within {
    flex-basis: 447px;
  }
}

.now-playing__poster {
  width: 100%;
  height: 300px;
  flex-shrink: 0;
  border-radius: 14px;
  object-fit: cover;
  transition: height 300ms linear;

  .now-playing__card:hover &,
  .now-playing__card:focus-within & {
    height: 224px;
  }
}

// Like Figma's smart animate: the synopsis never moves, only fades in and out.
// It's pinned where it sits in the hover state (top = 12 padding + 224 poster + 10 gap
// + 68 title/meta/chip + 7 gap) at the Hover variant's text width, so the lines never
// re-wrap; the card's overflow: hidden clips it while the card is still narrow
.now-playing__synopsis {
  position: absolute;
  top: 321px;
  left: 12px;
  display: -webkit-box;
  width: 397px;
  margin: 0;
  overflow: hidden;
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.3;
  opacity: 0;
  transition: opacity 300ms linear;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;

  .now-playing__card:hover &,
  .now-playing__card:focus-within & {
    opacity: 1;
  }
}

.now-playing__info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 7px;
}

.now-playing__name {
  width: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.now-playing__meta {
  margin: 0;
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.now-playing__rating {
  padding: 4px 7px;
  border-radius: 999px;
  background: $tint-red;
  color: $color-red;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

// margin-top: auto keeps the price and button at the bottom of the fixed-height card
.now-playing__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.now-playing__price {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.now-playing__btn {
  min-height: 0;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.now-playing__message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin: 0;
  padding: 80px 0;
  color: $text-secondary;
  font-size: 16px;

  p {
    margin: 0;
  }
}
</style>
