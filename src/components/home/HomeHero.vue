<template>
  <section class="hero">
    <div v-if="isLoading" class="hero__state" aria-busy="true">
      <div class="hero__content">
        <q-skeleton dark type="QChip" width="220px" height="27px" />
        <q-skeleton
          dark
          type="text"
          width="420px"
          height="64px"
          class="q-mt-md"
        />
        <q-skeleton
          dark
          type="text"
          width="300px"
          height="28px"
          class="q-mt-sm"
        />
        <q-skeleton
          dark
          type="text"
          width="620px"
          height="66px"
          class="q-mt-md"
        />
        <q-skeleton
          dark
          type="QBtn"
          width="300px"
          height="46px"
          class="q-mt-lg"
        />
      </div>
    </div>

    <div v-else-if="hasError" class="hero__state hero__state--message">
      <p>We couldn't load the featured films.</p>
      <q-btn
        unelevated
        rounded
        no-caps
        color="primary"
        label="Try again"
        @click="fetchSlides()"
      />
    </div>

    <div v-else-if="!movies.length" class="hero__state hero__state--message">
      <p>No featured films right now. Check back soon.</p>
    </div>

    <template v-else>
      <q-carousel
        v-model="slide"
        animated
        infinite
        swipeable
        :transition-duration="700"
        class="hero__carousel"
      >
        <q-carousel-slide
          v-for="(movie, index) in movies"
          :key="movie.id"
          :name="index"
          :img-src="movie.backdropUrl ?? undefined"
          class="hero__slide"
        >
          <div class="hero__shade" />

          <div class="hero__content">
            <span class="hero__tag"
              >Premiere · Week of {{ formatDay(movie.releaseDate, "D MMM") }}</span
            >

            <h1 class="hero__title">{{ movie.title }}</h1>

            <div class="hero__chips">
              <span class="hero__chip hero__chip--accent">{{
                movie.ageRating.code
              }}</span>
              <span class="hero__chip">
                <AppIcon name="timer" :size="14" />
                {{ movie.runtimeMinutes }} Min
              </span>
              <span
                v-for="format in movie.formats"
                :key="format.id"
                class="hero__chip"
              >
                {{ format.name }}
              </span>
            </div>

            <p class="hero__synopsis">{{ movie.synopsis }}</p>

            <div class="hero__actions">
              <q-btn
                unelevated
                rounded
                no-caps
                no-wrap
                color="primary"
                class="hero__btn"
                :to="{ name: 'movie', params: { slug: movie.slug } }"
              >
                <AppIcon name="ticket" class="hero__buy-icon" />
                Buy tickets
              </q-btn>
              <q-btn
                unelevated
                rounded
                no-caps
                label="All sessions"
                class="hero__btn hero__btn--ghost"
                :to="{ name: 'sessions' }"
              />
            </div>
          </div>
        </q-carousel-slide>
      </q-carousel>

      <div class="hero__controls">
        <div class="hero__bars">
          <button
            v-for="(movie, index) in movies"
            :key="movie.id"
            type="button"
            class="hero__bar"
            :aria-label="`Show ${movie.title}`"
            :aria-current="index === slide"
            @click="changeSlideTo(index)"
          >
            <span class="hero__track">
              <!-- The fill's CSS animation is the autoplay timer: when it ends, the next slide shows -->
              <span
                v-if="index === slide"
                :key="cycle"
                class="hero__fill"
                :style="{ animationDuration: `${slideLineProgressMs}ms` }"
                @animationend="nextSlide"
              />
            </span>
          </button>
        </div>

        <q-btn
          round
          unelevated
          icon="chevron_left"
          class="hero__arrow"
          aria-label="Previous film"
          @click="prevSlide"
        />
        <q-btn
          round
          unelevated
          icon="chevron_right"
          class="hero__arrow"
          aria-label="Next film"
          @click="nextSlide"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

import { fetchFeatured } from "@/api/movies";
import type { MovieWithSynopsis } from "@/api/resources/Movie";
import AppIcon from "@/components/ui/AppIcon.vue";
import { formatDay } from "@/utils/date";

const movies = ref<MovieWithSynopsis[]>([]);
const isLoading = ref(true);
const hasError = ref(false);

const slide = ref(0);
// Bumped on every slide change so the fill restarts even when the index stays the same
const cycle = ref(0);
const slideLineProgressMs = 6000;

const fetchSlides = async () => {
  isLoading.value = true;
  hasError.value = false;

  try {
    movies.value = await fetchFeatured();
    slide.value = 0;
  } catch {
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};

const changeSlideTo = (index: number) => {
  const count = movies.value.length;
  slide.value = (index + count) % count;
  cycle.value++;
};

const nextSlide = () => changeSlideTo(slide.value + 1);
const prevSlide = () => changeSlideTo(slide.value - 1);

// Swipes change the slide through v-model, so restart the timer for those too
watch(slide, () => cycle.value++);

onMounted(fetchSlides);
</script>

<style scoped lang="scss">
$hero-height: 844px;
$gutter: 74px;

.hero {
  position: relative;
  height: $hero-height;
  overflow: hidden;
  background: #0d1218;
  color: #fff;
}

.hero__carousel {
  height: 100%;
  background: transparent;
}

.hero__slide {
  padding: 0;
  background-size: cover;
  background-position: center;
}

.hero__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      90deg,
      rgba(8, 12, 18, 0.85) 0%,
      rgba(8, 12, 18, 0.45) 45%,
      rgba(8, 12, 18, 0) 75%
    ),
    linear-gradient(0deg, rgba(8, 12, 18, 0.6) 0%, rgba(8, 12, 18, 0) 35%);
}

.hero__content {
  position: absolute;
  left: $gutter;
  bottom: 200px;
  max-width: 640px;
}

.hero__state--message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 100%;
  font-size: 18px;

  p {
    margin: 0;
  }
}

// Tag and chips are the Figma "Badge": 12px SemiBold label, hugged with 6px vertical padding
.hero__tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: $tint-red;
  color: $color-red;
  font-size: 12px;
  font-weight: 600;
  line-height: 13px;
  text-transform: uppercase;
}

.hero__title {
  margin: 16px 0 0;
  font-size: 48px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0;
  text-transform: uppercase;
}

.hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 16px;
}

.hero__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  background: $tint-white;
  font-size: 12px;
  font-weight: 600;
  line-height: 13px;

  &--accent {
    background: $tint-red;
    color: $color-red;
  }
}

.hero__synopsis {
  display: -webkit-box;
  margin: 20px 0 0;
  max-width: 620px;
  overflow: hidden;
  font-size: 16px;
  line-height: 1.3;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.hero__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 24px;
}

.hero__btn {
  min-height: 0;
  padding: 13px 22px;
  font-size: 14px;
  font-weight: 800;
  line-height: 15px;
}

.hero__btn--ghost {
  background: $tint-white;
  color: $text-primary;
}

.hero__buy-icon {
  margin-right: 4px;
}

.hero__controls {
  position: absolute;
  left: $gutter;
  right: $gutter;
  bottom: 46px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero__bars {
  display: flex;
  flex: 1;
  gap: 8px;
  margin-right: 12px;
}

.hero__bar {
  flex: 1;
  height: 24px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.hero__track {
  position: relative;
  display: block;
  height: 3px;
  overflow: hidden;
  border-radius: 3px;
  background: #fff;
}

.hero__fill {
  position: absolute;
  inset: 0;
  background: $primary;
  transform-origin: left;
  animation-name: hero-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.hero__arrow {
  width: 54px;
  height: 54px;
  background: rgba(8, 12, 18, 0.45);
  color: #fff;
  font-size: 18px;
}

@keyframes hero-progress {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}
</style>
