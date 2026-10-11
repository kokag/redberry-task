<template>
  <q-page class="movie">
    <div v-if="isLoading" class="movie__hero" aria-busy="true">
      <div class="movie__hero-content">
        <q-skeleton dark width="289px" height="374px" class="movie__poster" />
        <div class="movie__info">
          <q-skeleton dark type="QChip" width="105px" height="25px" />
          <q-skeleton dark type="text" width="420px" height="44px" />
          <q-skeleton dark type="text" width="560px" height="40px" />
        </div>
      </div>
    </div>

    <div v-else-if="isNotFound" class="movie__message">
      <p>We couldn't find this film.</p>
      <q-btn
        unelevated
        rounded
        no-caps
        color="primary"
        label="Browse sessions"
        :to="{ name: 'sessions' }"
      />
    </div>

    <div v-else-if="hasError || !movie" class="movie__message">
      <p>We couldn't load this film.</p>
      <q-btn
        unelevated
        rounded
        no-caps
        color="primary"
        label="Try again"
        @click="loadMovie"
      />
    </div>

    <template v-else>
      <section
        class="movie__hero"
        :style="{
          backgroundImage: movie.backdropUrl
            ? `url(${movie.backdropUrl})`
            : undefined
        }"
      >
        <div class="movie__hero-content">
          <img
            :src="movie.posterUrl ?? undefined"
            :alt="movie.title"
            class="movie__poster"
          />

          <div class="movie__info">
            <span class="movie__badge movie__badge--red">{{
              movie.isComingSoon ? "Coming soon" : "Now playing"
            }}</span>

            <div class="movie__text">
              <h1 class="movie__title">{{ movie.title }}</h1>
              <p class="movie__synopsis">{{ movie.synopsis }}</p>
            </div>

            <div class="movie__badges">
              <span
                class="movie__badge movie__badge--red"
                :title="movie.ageRating.description"
                >{{ movie.ageRating.code }}</span
              >
              <span class="movie__badge">
                <AppIcon name="timer" :size="14" />
                {{ movie.runtimeMinutes }} Min
              </span>
              <span
                v-for="format in movie.formats"
                :key="format.id"
                class="movie__badge"
                >{{ format.name }}</span
              >
            </div>
          </div>
        </div>
      </section>

      <div class="movie__body">
        <section class="movie__sessions">
          <div class="movie__sessions-head">
            <h2 class="movie__heading">Sessions</h2>
            <DatePicker
              v-model="selectedDate"
              :available-dates="movie.availableDates"
              large
            />
          </div>

          <!-- Spec 4: logged-in users under the film's age see the sessions disabled, with the reason -->
          <p v-if="isTooYoung" class="movie__warning">
            This film is rated {{ movie.ageRating.code }}. You cannot buy
            tickets for it with this account.
          </p>

          <div v-if="sessionsLoading" class="movie__venues" aria-busy="true">
            <div v-for="n in 2" :key="n" class="movie__venue-skeleton">
              <q-skeleton dark type="text" width="120px" />
              <q-skeleton dark width="454px" height="133px" />
            </div>
          </div>

          <div v-else-if="sessionsError" class="movie__empty">
            <p>We couldn't load the sessions.</p>
            <q-btn
              unelevated
              rounded
              no-caps
              color="primary"
              label="Try again"
              @click="loadSessions"
            />
          </div>

          <!-- Coming Soon films have no dates at all, so "another date" wouldn't help -->
          <p v-else-if="!venues.length" class="movie__empty">
            {{
              movie.availableDates.length
                ? "No sessions on this day. Try another date."
                : "No sessions scheduled for this film yet."
            }}
          </p>

          <div v-else class="movie__venues">
            <VenueSessions
              v-for="group in venues"
              :key="group.venue.id"
              :group="group"
              :disabled="isTooYoung"
              @select="selectSession"
            />
          </div>
        </section>

        <MovieDetails :movie="movie" class="movie__details" />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { isAxiosError } from "axios";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { fetchMovie, fetchMovieSessions } from "@/api/movies";
import type { MovieDetail } from "@/api/resources/Movie";
import type {
  Session,
  VenueSessions as VenueGroup
} from "@/api/resources/Session";
import { useBookingDialog } from "@/components/booking/useBookingDialog";
import MovieDetails from "@/components/movie/MovieDetails.vue";
import VenueSessions from "@/components/movie/VenueSessions.vue";
import DatePicker from "@/components/ui/DatePicker.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import useAuthStore from "@/stores/useAuthStore";
import { today } from "@/utils/date";
import { addRecentlyViewed } from "@/utils/recentlyViewed";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const movie = ref<MovieDetail | null>(null);
const isLoading = ref(true);
const isNotFound = ref(false);
const hasError = ref(false);

const selectedDate = ref(today());
const venues = ref<VenueGroup[]>([]);
const sessionsLoading = ref(false);
const sessionsError = ref(false);

const slug = computed(() => String(route.params.slug));

// ---- Fetching ----

const loadMovie = async () => {
  isLoading.value = true;
  isNotFound.value = false;
  hasError.value = false;

  try {
    movie.value = await fetchMovie(slug.value);
    addRecentlyViewed(movie.value);

    // The day asked for in the URL (from a session card), else today if it has sessions,
    // else the first day that does (the picker disables the rest)
    const dates = movie.value.availableDates;
    const requestedDate = String(route.query.date ?? "");
    selectedDate.value = dates.includes(requestedDate)
      ? requestedDate
      : dates.includes(today())
        ? today()
        : (dates.find(day => day > today()) ?? today());

    await loadSessions();
    await openRequestedSession();
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      isNotFound.value = true;
    } else {
      hasError.value = true;
    }
  } finally {
    isLoading.value = false;
  }
};

const loadSessions = async () => {
  // Clicking days quickly: only the response for the day still selected may be shown
  const date = selectedDate.value;
  sessionsLoading.value = true;
  sessionsError.value = false;

  try {
    const result = await fetchMovieSessions(slug.value, date);
    if (date === selectedDate.value) venues.value = result;
  } catch {
    if (date === selectedDate.value) sessionsError.value = true;
  } finally {
    if (date === selectedDate.value) sessionsLoading.value = false;
  }
};

// Runs on open and when going from one film to another (the page component is reused)
watch(slug, loadMovie, { immediate: true });

// Only day clicks reload here; loadMovie already loads the first day itself
watch(selectedDate, () => {
  if (!isLoading.value) void loadSessions();
});

// ---- Sessions ----

// Guests aren't checked (spec 4): their age is known only after login
const isTooYoung = computed(() => {
  const age = auth.user?.age;
  return !!movie.value && age != null && age < movie.value.ageRating.minAge;
});

const { openBooking } = useBookingDialog();

const selectSession = (session: Session) => openBooking(session.id);

// Coming from a session card on the Sessions page (?session=123): open its seat selection right away.
// The query is cleared first, so a refresh or coming Back here doesn't open the modal again;
// awaited because Quasar closes open dialogs when the route changes.
// A user too young for the film sees the sessions disabled instead (spec 4)
const openRequestedSession = async () => {
  const sessionId = Number(route.query.session);
  if (!sessionId) return;

  await router.replace({ path: route.path });
  if (!isTooYoung.value) openBooking(sessionId);
};
</script>

<style scoped lang="scss">
// Sizes from the Figma "Movie inside page" frame (1728 wide)
.movie {
  padding-bottom: 60px;
  color: $text-primary;
}

// Backdrop under a 20% bg/page scrim with a 10px blur (Figma "Rectangle 1")
.movie__hero {
  position: relative;
  height: 567px;
  background-color: $bg-card;
  background-position: center;
  background-size: cover;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba($bg-page, 0.2);
    backdrop-filter: blur(10px);
  }
}

.movie__hero-content {
  position: absolute;
  top: 152px;
  left: 60px;
  display: flex;
  gap: 34px;
  align-items: flex-end;
}

.movie__poster {
  display: block;
  width: 289px;
  height: 374px;
  border-radius: 14px;
  box-shadow: 0 4px 64px rgba(0, 0, 0, 0.2);
  object-fit: cover;
  background: $bg-card;
}

.movie__info {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-start;
  width: 580px;
}

.movie__text {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.movie__title {
  margin: 0;
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
}

.movie__synopsis {
  max-width: 560px;
  margin: 0;
  font-size: 14px;
  line-height: 1.3;
}

.movie__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

// Figma "Badge": 12px SemiBold label, 6px/10px padding
.movie__badge {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: $tint-white;
  font-size: 12px;
  font-weight: 600;
  line-height: 13px;
  text-transform: uppercase;

  &--red {
    background: $tint-red;
    color: $color-red;
  }
}

.movie__body {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 34px;
  padding: 0 51px;
}

.movie__sessions {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 27px;
  min-width: 0;
  padding-bottom: 26px;
}

.movie__sessions-head {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.movie__heading {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.movie__details {
  flex: 0 0 441px;
}

.movie__venues {
  display: flex;
  flex-direction: column;
  gap: 27px;
}

.movie__venue-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.movie__warning {
  margin: 0;
  padding: 9px 13px;
  border-radius: 12px;
  background: $tint-orange;
  color: $color-orange;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.movie__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  margin: 0;
  color: $text-secondary;
  font-size: 16px;

  p {
    margin: 0;
  }
}

.movie__message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 200px 0 80px;
  color: $text-secondary;
  font-size: 16px;

  p {
    margin: 0;
  }
}
</style>
