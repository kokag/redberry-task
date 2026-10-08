<template>
  <q-page class="profile">
    <h1 class="profile__title">My Profile</h1>

    <!-- Both tabs and panels follow `tab`; the red indicator slides between the tabs -->
    <q-tabs v-model="tab" no-caps align="left" indicator-color="primary" class="profile__tabs">
      <q-tab name="info" label="Personal Information" :ripple="false" />
      <q-tab name="tickets" label="My Tickets" :ripple="false" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated class="profile__panels">
      <q-tab-panel name="info">
        <PersonalInfo v-if="user" :user="user" />
      </q-tab-panel>

      <q-tab-panel name="tickets">
        <MyTickets />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import useAuthStore from "@/stores/usaAuthStore";
import {storeToRefs} from "pinia";
import MyTickets from "@/components/profile/MyTickets.vue";
import PersonalInfo from "@/components/profile/PersonalInfo.vue";

const tab = ref("info");

const {user} = storeToRefs(useAuthStore())

const form = ref({});

</script>

<style scoped lang="scss">
.profile {
  padding: 116px 50px 60px;
  color: $text-primary;
}

.profile__title {
  margin: 0 0 30px;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
}

// The divider is an inset shadow, so the active tab's 2px indicator draws on top of it
.profile__tabs {
  box-shadow: inset 0 -1px $tint-white;

  :deep(.q-tabs__content) {
    gap: 40px;
  }

  // Quasar's tabs are 48px tall with 16px side padding; the design is text + 16px to the line
  :deep(.q-tab) {
    min-height: 0;
    padding: 0 2px 16px;
    color: $text-secondary;
    opacity: 1;
  }

  :deep(.q-tab--active) {
    color: $text-primary;
  }

  :deep(.q-tab__content) {
    min-width: 0;
    padding: 0;
  }

  :deep(.q-tab__label) {
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
  }

  // No grey hover/focus overlay on the tabs
  :deep(.q-focus-helper) {
    display: none;
  }
}

// Quasar gives panels a white background and 16px padding
.profile__panels {
  background: none;

  .q-tab-panel {
    padding: 0;
  }
}
</style>
