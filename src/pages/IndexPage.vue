<template>
  <q-page>
    <HomeHero />
    <div class="home__sections">
      <RecentlyViewed />
      <NowPlaying />
      <hr class="home__divider" />
      <ComingSoon />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import ComingSoon from "@/components/home/ComingSoon.vue";
import HomeHero from "@/components/home/HomeHero.vue";
import NowPlaying from "@/components/home/NowPlaying.vue";
import RecentlyViewed from "@/components/home/RecentlyViewed.vue";
</script>

<style scoped lang="scss">
.home__sections {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 32px 0 40px;
}

.home__divider {
  width: 100%;
  height: 1px;
  margin: 0;
  border: 0;
  background: $bg-raised;
}
</style>
