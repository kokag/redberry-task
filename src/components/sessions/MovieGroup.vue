<template>
  <article class="movie-group">
    <header class="movie-group__header">
      <img
        :src="group.movie.posterUrl ?? undefined"
        :alt="group.movie.title"
        class="movie-group__poster"
      />

      <div class="movie-group__info">
        <h2 class="movie-group__title">
          {{ group.movie.title }}
          <span class="movie-group__rating">{{
            group.movie.ageRating.code
          }}</span>
        </h2>
        <span class="movie-group__runtime"
          >{{ group.movie.runtimeMinutes }} min</span
        >
      </div>
    </header>

    <!-- One row of cards per film; it scrolls sideways when there are more than fit -->
    <div class="movie-group__sessions">
      <SessionCard
        v-for="session in group.sessions"
        :key="session.id"
        :session="session"
        @select="emit('select', $event)"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import type { MovieSessions, Session } from "@/api/resources/Session";
import SessionCard from "@/components/sessions/SessionCard.vue";

defineProps<{
  group: MovieSessions;
}>();

const emit = defineEmits<{
  select: [session: Session];
}>();
</script>

<style scoped lang="scss">
.movie-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.movie-group__header {
  display: flex;
  gap: 16px;
  align-items: center;
}

.movie-group__poster {
  width: 56px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  background: $bg-card;
}

.movie-group__info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.movie-group__title {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
}

// Same badge as the Now Playing cards
.movie-group__rating {
  padding: 4px 7px;
  border-radius: 999px;
  background: $tint-red;
  color: $color-red;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.movie-group__runtime {
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.3;
}

.movie-group__sessions {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-color: $bg-raised transparent;
  scrollbar-width: thin;
}
</style>
