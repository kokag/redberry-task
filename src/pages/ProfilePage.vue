<template>
  <q-page class="profile">
    <h1 class="profile__title">My Profile</h1>
    <!-- Both tabs and panels follow `tab`; the red indicator slides between the tabs -->
    <q-tabs
      v-model="tab"
      no-caps
      inline-label
      align="left"
      indicator-color="primary"
      class="profile__tabs"
    >
      <q-tab name="info" label="Personal Information" :ripple="false" />
      <q-tab name="tickets" label="My Tickets" :ripple="false">
        <!-- Number of upcoming tickets -->
        <span v-if="upcomingCount" class="profile__count">{{ upcomingCount }}</span>
      </q-tab>
    </q-tabs>

    <q-tab-panels v-model="tab" animated class="profile__panels">
      <q-tab-panel name="info">
        <PersonalInfo v-if="user" :user="user" />
      </q-tab-panel>

      <q-tab-panel name="tickets">
        <MyTickets :orders="orders" :has-error="hasError" :reload="fetchOrders" />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import useAuthStore from "@/stores/useAuthStore";
import {storeToRefs} from "pinia";
import { api } from "@/boot/axios";
import type { Order } from "@/api/resources/Booking";
import MyTickets from "@/components/profile/MyTickets.vue";
import PersonalInfo from "@/components/profile/PersonalInfo.vue";

const route = useRoute();
const router = useRouter();

// The open tab lives in the URL (`?tab=tickets`), so links can open My Tickets directly
const tab = computed({
  get: () => (route.query.tab === "tickets" ? "tickets" : "info"),
  set: (value) => void router.replace({ query: { tab: value } })
});

const {user} = storeToRefs(useAuthStore())

// All the user's orders, upcoming and past (null until the first load finishes).
// Loaded here, not in MyTickets, because the tab's red count needs them before that tab is opened
const orders = ref<Order[] | null>(null);
const hasError = ref(false);

// Also called by MyTickets after a refund, so the cards show what the server has now
const fetchOrders = async () => {
  hasError.value = false;
  try {
    const { data } = await api.get<{ data: Order[] }>("/tickets");
    orders.value = data.data;
  } catch {
    hasError.value = true;
  }
};

onMounted(fetchOrders);

const upcomingCount = computed(() => orders.value?.filter(order => order.isUpcoming).length ?? 0);

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
    gap: 8px;
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

// Red pill with the upcoming tickets count, next to "My Tickets"
.profile__count {
  padding: 2px 6px;
  border-radius: 999px;
  background: $color-red;
  color: $text-primary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

// Quasar gives panels a white background and 16px padding
.profile__panels {
  background: none;

  .q-tab-panel {
    padding: 0;
  }
}
</style>
