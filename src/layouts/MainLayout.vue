<template>
  <q-layout view="lHh Lpr lFf">
    <AppNavbar/>

    <q-page-container>
      <router-view />
      <AppFooter />
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">
import AppFooter from "@/components/layout/AppFooter.vue";
import AppNavbar from "@/components/layout/AppNavbar.vue";
</script>
