<template>
  <!-- A sold-out session stays visible (so the showtime is readable) but can't be clicked -->
  <button
    type="button"
    class="session-card"
    :disabled="session.isSoldOut"
    @click="emit('select', session)"
  >
    <span class="session-card__top">
      <span class="session-card__time">{{ session.time }}</span>
      <span class="session-card__format">{{ session.format.name }}</span>
    </span>

    <span class="session-card__row">
      <span class="session-card__language">{{ session.language.name }}</span>

      <span v-if="session.isSoldOut" class="session-card__seats">Sold out</span>
      <span
        v-else
        class="session-card__seats"
        :class="{ 'session-card__seats--low': session.seatsLeft <= LOW_SEATS }"
      >
        <AppIcon name="ticket" :size="12" />
        {{ session.seatsLeft }} left
      </span>
    </span>

    <span class="session-card__row">
      <span class="session-card__place">
        {{ session.venue.name }} · Hall {{ session.hall.name }}
      </span>
      <span class="session-card__price">₾{{ session.price }}</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import type { Session } from "@/api/resources/Session";
import AppIcon from "@/components/ui/AppIcon.vue";

defineProps<{
  session: Session;
}>();

const emit = defineEmits<{
  select: [session: Session];
}>();

// The design shows "3 left" in red and "21 left" in green; the API has no threshold, so this is ours
const LOW_SEATS = 10;
</script>

<style scoped lang="scss">
// Sizes from the Figma "Sessions time" component
.session-card {
  display: flex;
  flex: 0 0 252px;
  flex-direction: column;
  gap: 12px;
  padding: 15px;
  border: 0;
  border-radius: 16px;
  background: $bg-card;
  color: $text-primary;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled),
  &:focus-visible {
    background: $bg-raised;
    outline: none;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.session-card__top,
.session-card__row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.session-card__time {
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
}

.session-card__format {
  padding: 5px 10px;
  border-radius: 999px;
  background: $bg-raised;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.session-card__language {
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.session-card__seats {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
  color: $color-green;
  font-size: 12px;
  line-height: 1.3;

  &--low {
    color: $color-red;
  }

  .session-card:disabled & {
    color: $text-secondary;
  }
}

.session-card__place {
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-card__price {
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}
</style>
