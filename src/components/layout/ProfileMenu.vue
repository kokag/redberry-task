<template>
  <q-menu
    v-model="isOpen"
    anchor="bottom right"
    self="top right"
    :offset="[0, 12]"
    class="profile-menu"
  >
    <div class="profile-menu__header">
      <UserAvatar :user="user" :size="42" />

      <div class="profile-menu__identity">
        <span class="profile-menu__name">{{ getFullName(user) }}</span>
        <span class="profile-menu__email">{{ user.email }}</span>
      </div>
    </div>

    <div
      v-if="user.profileComplete"
      class="profile-menu__status profile-menu__status--complete"
    >
      Profile Complete
      <AppIcon name="check" />
    </div>

    <div v-else class="profile-menu__status profile-menu__status--incomplete">
      <span class="profile-menu__status-title">Profile incomplete</span>
      <span class="profile-menu__status-text"
        >Please complete your profile to enable booking</span
      >
    </div>

    <nav class="profile-menu__links">
      <router-link v-close-popup :to="{ name: 'profile' }" class="profile-menu__item">
        <AppIcon name="user" />
        My Profile
      </router-link>

      <router-link
        v-close-popup
        :to="{ name: 'profile', query: { tab: 'tickets' } }"
        class="profile-menu__item"
      >
        <AppIcon name="ticket" />
        My Tickets
      </router-link>
    </nav>

    <div class="profile-menu__divider" />

    <button
      v-close-popup
      type="button"
      class="profile-menu__item profile-menu__item--danger"
      @click="logout"
    >
      <AppIcon name="logout" />
      Logout
    </button>
  </q-menu>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import type { User } from "@/api/resources/User";
import AppIcon from "@/components/ui/AppIcon.vue";
import UserAvatar from "@/components/layout/UserAvatar.vue";
import useAuthStore from "@/stores/useAuthStore";
import { getFullName } from "@/utils/user";

defineProps<{
  user: User;
}>();

const isOpen = defineModel<boolean>({ default: false });

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

// The store drops the token even when the request fails, so there is nothing to recover from.
// A logged-in-only page (profile) can't stay open afterwards, so go home from there
const logout = async () => {
  await auth.logout().catch(() => undefined);
  if (route.meta.is_auth) void router.push({ name: "home-page" });
};
</script>

<style lang="scss">
// QMenu teleports to <body>, so its own box can't be styled from the scoped block
.q-menu.profile-menu {
  display: flex;
  flex-direction: column;
  width: 302px;
  max-height: none;
  padding-bottom: 10px;
  border-radius: 16px;
  background: $bg-page;
  color: $text-primary;
}
</style>

<style scoped lang="scss">
.profile-menu__header {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 20px 20px 0;
}

.profile-menu__identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.profile-menu__name,
.profile-menu__email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-menu__name {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.profile-menu__email {
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.profile-menu__status {
  display: flex;
  margin: 16px 20px 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;

  &--complete {
    gap: 8px;
    align-items: center;
    height: 36px;
    padding: 0 12px;
    background: $tint-green;
    color: $color-green;
  }

  &--incomplete {
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    background: $tint-orange;
    color: $color-orange;
  }
}

.profile-menu__status-text {
  color: $text-secondary;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.3;
}

.profile-menu__links {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.profile-menu__item {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  height: 40px;
  padding: 0 20px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: $text-primary;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: $tint-white;
    outline: none;
  }

  &--danger {
    color: $color-red;
  }
}

.profile-menu__divider {
  height: 1px;
  margin: 3px 0;
  background: $tint-white;
}
</style>
