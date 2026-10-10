<template>
  <section class="coming-soon">
    <h2 class="coming-soon__title">Coming Soon</h2>

    <div v-if="isLoading" class="coming-soon__row" aria-busy="true">
      <q-skeleton v-for="n in 4" :key="n" dark class="coming-soon__card" height="160px" />
    </div>

    <div v-else-if="hasError" class="coming-soon__message">
      <p>We couldn't load the upcoming films.</p>
      <q-btn unelevated rounded no-caps color="primary" label="Try again" @click="fetchMovies" />
    </div>

    <p v-else-if="!movies.length" class="coming-soon__message">
      No upcoming films announced yet. Check back soon.
    </p>

    <div v-else class="coming-soon__row">
      <!-- Coming Soon films have no page and no sessions, so only "Notify Me" is clickable -->
      <article v-for="movie in movies" :key="movie.id" class="coming-soon__card">
        <img :src="movie.backdropUrl ?? undefined" :alt="movie.title" class="coming-soon__image" />

        <div class="coming-soon__info">
          <div class="coming-soon__details">
            <span class="coming-soon__date">In cinemas {{ formatDay(movie.releaseDate, "D MMMM") }}</span>
            <h3 class="coming-soon__name">{{ movie.title }}</h3>
            <p class="coming-soon__meta">
              {{ movie.genres[0]?.name }} · {{ movie.runtimeMinutes }} min
            </p>
            <span class="coming-soon__rating">{{ movie.ageRating.code }}</span>
          </div>

          <q-btn
            unelevated
            rounded
            no-caps
            class="coming-soon__notify"
            :disable="movie.isNotified"
            :loading="notifyingSlug === movie.slug"
            @click="notify(movie)"
          >
            <AppIcon :name="movie.isNotified ? 'check' : 'bell'" />
            {{ movie.isNotified ? "You will be notified" : "Notify Me" }}
          </q-btn>
          <span v-if="failedSlug === movie.slug" class="coming-soon__error">
            Something went wrong. Please try again.
          </span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { isAxiosError } from "axios";
import { onMounted, ref } from "vue";

import { fetchComingSoon, notifyMe } from "@/api/movies";
import type { Movie } from "@/api/resources/Movie";
import { useAuthDialog } from "@/components/auth/useAuthDialog";
import AppIcon from "@/components/ui/AppIcon.vue";
import useAuthStore from "@/stores/useAuthStore";
import { formatDay } from "@/utils/date";

const auth = useAuthStore();
const { openLoginDialog } = useAuthDialog();

const movies = ref<Movie[]>([]);
const isLoading = ref(true);
const hasError = ref(false);

const fetchMovies = async () => {
  isLoading.value = true;
  hasError.value = false;

  try {
    movies.value = await fetchComingSoon(10);
  } catch {
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};

const notifyingSlug = ref<string | null>(null);
const failedSlug = ref<string | null>(null);

// Guests log in first; once the login dialog closes with OK, the subscription continues on its own
const notify = async (movie: Movie) => {
  if (!auth.isAuthenticated) {
    openLoginDialog().onOk(() => notify(movie));
    return;
  }

  notifyingSlug.value = movie.slug;
  failedSlug.value = null;

  try {
    const result = await notifyMe(movie.slug);
    movie.isNotified = result.subscribed;
  } catch (error) {
    // 401: the token expired (axios already dropped it), so ask to log in again and retry
    if (isAxiosError(error) && error.response?.status === 401) {
      openLoginDialog().onOk(() => notify(movie));
    } else {
      failedSlug.value = movie.slug;
    }
  } finally {
    notifyingSlug.value = null;
  }
};

onMounted(fetchMovies);
</script>

<style scoped lang="scss">
// Sizes from the Figma "Card_medium" component and the Coming Soon frame
.coming-soon {
  padding: 0 70px;
  color: $text-primary;
}

.coming-soon__title {
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
}

.coming-soon__row {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-color: $bg-raised transparent;
  scrollbar-width: thin;
}

.coming-soon__card {
  display: flex;
  flex: 0 0 470px;
  gap: 15px;
  height: 160px;
  padding: 12px;
  border-radius: 20px;
  background: $bg-card;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.coming-soon__image {
  flex-shrink: 0;
  width: 229px;
  height: 136px;
  border-radius: 14px;
  object-fit: cover;
}

.coming-soon__info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  min-width: 0;
}

.coming-soon__details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 7px;
  max-width: 100%;
}

.coming-soon__date {
  color: $color-red;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
}

.coming-soon__name {
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coming-soon__meta {
  margin: 0;
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.coming-soon__rating {
  padding: 4px 7px;
  border-radius: 999px;
  background: $tint-red;
  color: $color-red;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.coming-soon__notify {
  min-height: 0;
  // 5px + the 1px border = Figma's 6px padding (its border is drawn centered, not added)
  padding: 5px 12px;
  border: 1px solid $text-secondary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;

  :deep(.q-btn__content) {
    gap: 4px;
  }
}

.coming-soon__error {
  color: $color-red;
  font-size: 12px;
}

.coming-soon__message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin: 0;
  padding: 60px 0;
  color: $text-secondary;
  font-size: 16px;

  p {
    margin: 0;
  }
}
</style>
