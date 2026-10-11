<template>
  <span
    class="user-avatar"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <img
      v-if="user.avatar"
      :src="user.avatar"
      alt=""
      class="user-avatar__image"
    />
    <span v-else class="user-avatar__initials">{{ getInitials(user) }}</span>

    <span
      role="img"
      class="user-avatar__status"
      :class="
        user.profileComplete
          ? 'user-avatar__status--complete'
          : 'user-avatar__status--incomplete'
      "
      :aria-label="
        user.profileComplete ? 'Profile complete' : 'Profile incomplete'
      "
    />
  </span>
</template>

<script setup lang="ts">
import type { User } from "@/api/resources/User";
import { getInitials } from "@/utils/user";

defineProps<{
  user: User;
  size: number;
}>();
</script>

<style scoped lang="scss">
.user-avatar {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: $bg-card;
}

.user-avatar__image {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.user-avatar__initials {
  color: $text-primary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

// 8px dot with a 1px page-colored ring, centered 4px in from the bottom right corner
.user-avatar__status {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 10px;
  height: 10px;
  border: 1px solid $bg-page;
  border-radius: 50%;

  &--complete {
    background: $color-green;
  }

  &--incomplete {
    background: $color-orange;
  }
}
</style>
