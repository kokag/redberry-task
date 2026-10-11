<template>
  <section class="venue">
    <h3 class="venue__name">{{ group.venue.name }}</h3>

    <div class="venue__halls">
      <div v-for="hall in halls" :key="hall.name" class="venue__hall">
        <span class="venue__hall-name">Hall {{ hall.name }}</span>

        <div class="venue__sessions">
          <!-- Sold-out and age-blocked sessions stay visible but can't be clicked -->
          <button
            v-for="session in hall.sessions"
            :key="session.id"
            type="button"
            class="ticket"
            :disabled="disabled || session.isSoldOut"
            @click="emit('select', session)"
          >
            <span class="ticket__main">
              <span class="ticket__time">{{ session.time }}</span>
              <span class="ticket__meta">
                <span :title="session.language.name">{{
                  session.language.code
                }}</span>
                <span class="ticket__format">{{ session.format.name }}</span>
              </span>
            </span>

            <span class="ticket__side">
              <span class="ticket__price">₾{{ session.price }}</span>
              <span class="ticket__seats">
                <template v-if="session.isSoldOut">Sold out</template>
                <template v-else>
                  <AppIcon name="ticket" :size="12" />
                  {{ session.seatsLeft }} left
                </template>
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { Session, VenueSessions } from "@/api/resources/Session";
import AppIcon from "@/components/ui/AppIcon.vue";

const props = defineProps<{
  group: VenueSessions;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  select: [session: Session];
}>();

// The API groups by venue only; the design splits each venue into one box per hall
const halls = computed(() => {
  const byHall: Record<string, Session[]> = {};

  props.group.sessions.forEach(session => {
    (byHall[session.hall.name] ??= []).push(session);
  });

  return Object.entries(byHall).map(([name, sessions]) => ({ name, sessions }));
});
</script>

<style scoped lang="scss">
.venue {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.venue__name {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.venue__halls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.venue__hall {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 15px;
  border-radius: 18px;
  background: $bg-card;
}

.venue__hall-name {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.venue__sessions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ticket {
  display: flex;
  min-width: 207px;
  min-height: 81px;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: $bg-page;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  color: $text-primary;
  font: inherit;
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

.ticket__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-width: 124px;
  padding: 15px 8px;
  white-space: nowrap;
}

.ticket__time {
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.ticket__meta {
  display: flex;
  gap: 6px;
  align-items: center;
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.ticket__format {
  padding: 4px 12px;
  border-radius: 999px;
  background: $bg-card;
  font-weight: 600;
  line-height: 1;
}

.ticket__side {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 10px 15px;
  border-left: 1px dashed $text-secondary;

  // The two notches on the tear line, filled with the hall box color.
  // Anchored to the dashed line, so they move with it when the card grows
  &::before,
  &::after {
    content: "";
    position: absolute;
    left: -7.5px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: $bg-card;
  }

  &::before {
    top: -7px;
  }

  &::after {
    bottom: -7px;
  }
}

.ticket__price {
  color: $color-red;
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
}

.ticket__seats {
  display: flex;
  gap: 4px;
  align-items: center;
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
  white-space: nowrap;
}
</style>
