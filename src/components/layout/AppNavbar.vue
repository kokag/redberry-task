<template>
  <header class="navbar">
    <div class="navbar__start">
      <router-link :to="{ name: 'home-page' }" class="navbar__logo" aria-label="Kino XII home">
        KINO <span class="navbar__logo-accent">XII</span>
      </router-link>

      <router-link :to="{ name: 'sessions' }" class="navbar__link">Sessions</router-link>
    </div>

    <div class="navbar__end">
      <SearchBar />

      <button
        v-if="auth.user"
        type="button"
        class="navbar__profile"
        aria-haspopup="menu"
        :aria-expanded="isMenuOpen"
      >
        <UserAvatar :user="auth.user" :size="40" />
        <span class="navbar__name">{{ getFirstName(auth.user) }}</span>
        <AppIcon
          name="chevron-down"
          :size="20"
          class="navbar__chevron"
          :class="{ 'navbar__chevron--open': isMenuOpen }"
        />

        <ProfileMenu v-model="isMenuOpen" :user="auth.user" />
      </button>

      <div v-else class="navbar__auth">
        <q-btn
          unelevated
          rounded
          no-caps
          color="primary"
          label="Sign up"
          class="navbar__btn"
          @click="openRegisterDialog"
        />
        <q-btn
          unelevated
          rounded
          no-caps
          label="Log in"
          class="navbar__btn navbar__btn--light"
          @click="openLoginDialog"
        />
      </div>
    </div>

  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ProfileMenu from "@/components/layout/ProfileMenu.vue";
import SearchBar from "@/components/layout/SearchBar.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import useAuthStore from "@/stores/useAuthStore";
import { getFirstName } from "@/utils/user";
import {useAuthDialog} from "@/components/auth/useAuthDialog";

const { openLoginDialog, openRegisterDialog } = useAuthDialog();

const auth = useAuthStore();



const isMenuOpen = ref(false);
</script>

<style scoped lang="scss">

.navbar {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 111px;
  padding: 30px 60px 40px;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.57) 0%,
    rgba(0, 0, 0, 0.51) 32.1%,
    rgba(0, 0, 0, 0) 93.9%
  );
  color: $text-primary;
}

.navbar__start,
.navbar__end,
.navbar__auth {
  display: flex;
  align-items: center;
}

.navbar__start {
  gap: 36px;
}

.navbar__end {
  gap: 32px;
}

.navbar__auth {
  gap: 12px;
}

.navbar__logo {
  color: $text-primary;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  text-decoration: none;
}

.navbar__logo-accent {
  color: $color-red;
}

.navbar__link {
  color: $text-primary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.06em;
  text-decoration: none;
  text-transform: uppercase;
}

.navbar__btn {
  min-height: 0;
  height: 41px;
  padding: 0 22px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;

  &--light {
    background: $text-primary;
    color: $bg-page;
  }
}

.navbar__profile {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 0;
  border: 0;
  background: none;
  color: $text-primary;
  font: inherit;
  cursor: pointer;
}

.navbar__name {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

// Figma puts 24px between the avatar/name group and the chevron
.navbar__chevron {
  margin-left: 12px;
  transition: transform 0.2s;

  &--open {
    transform: rotate(180deg);
  }
}
</style>
