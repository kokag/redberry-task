<template>
  <!-- Nothing at all until the user has opened a film page -->
  <template v-if="movies.length">
    <section class="recently-viewed">
      <h2 class="recently-viewed__title">Recently viewed</h2>

      <div class="recently-viewed__row">
        <router-link
          v-for="movie in movies"
          :key="movie.slug"
          :to="{ name: 'movie', params: { slug: movie.slug } }"
          class="recently-viewed__card"
        >
          <img :src="movie.posterUrl ?? undefined" :alt="movie.title" class="recently-viewed__image" />

          <div class="recently-viewed__info">
            <h3 class="recently-viewed__name">{{ movie.title }}</h3>
            <p class="recently-viewed__meta">{{ movie.genre }} · {{ movie.runtimeMinutes }} min</p>
            <span class="recently-viewed__rating">{{ movie.ageRating }}</span>
          </div>
        </router-link>
      </div>
    </section>

    <hr class="recently-viewed__divider" />
  </template>
</template>

<script setup lang="ts">
import { getRecentlyViewed } from "@/utils/recentlyViewed";

// Read once: the home page is created again every time the user comes back to it
const movies = getRecentlyViewed();
</script>

<style scoped lang="scss">
// Sizes from the Figma "Card_Small" component and the Recently viewed frame on "Home_authorized"
.recently-viewed {
  padding: 9px 70px 0;
  color: $text-primary;
}

.recently-viewed__title {
  margin: 0 0 20px;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
}

.recently-viewed__row {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-color: $bg-raised transparent;
  scrollbar-width: thin;
}

.recently-viewed__card {
  display: flex;
  flex: 0 0 329px;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 16px;
  background: $bg-card;
  color: inherit;
  text-decoration: none;
}

.recently-viewed__image {
  flex-shrink: 0;
  width: 87px;
  height: 67px;
  border-radius: 8px;
  object-fit: cover;
}

.recently-viewed__info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.recently-viewed__name {
  max-width: 210px;
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.recently-viewed__meta {
  margin: 0;
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.recently-viewed__rating {
  padding: 4px 8px;
  border-radius: 999px;
  background: $tint-red;
  color: $color-red;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.recently-viewed__divider {
  width: 100%;
  height: 1px;
  margin: 0;
  border: 0;
  background: $bg-raised;
}
</style>
