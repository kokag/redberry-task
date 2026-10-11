<template>
  <!-- Rendered only from the POST /orders response, so it shows what was actually stored -->
  <div class="confirmation">
    <div class="confirmation__heading">
      <span class="confirmation__icon"><AppIcon name="check" :size="24" /></span>
      <h2 class="confirmation__title">Booking confirmed!</h2>
      <p class="confirmation__text">
        Your tickets are ready. We've sent the confirmation to your email.
      </p>
      <span class="confirmation__reference">Order #{{ order.reference }}</span>
    </div>

    <div class="confirmation__card">
      <div class="confirmation__film">
        <img
          :src="order.session.movie?.posterUrl ?? undefined"
          :alt="order.session.movie?.title"
          class="confirmation__poster"
        />
        <div>
          <p class="confirmation__film-title">{{ order.session.movie?.title }}</p>
          <p class="confirmation__meta">
            {{ order.session.venue.name }} · Hall {{ order.session.hall.name }}
            · {{ formatDay(order.session.date) }} · {{ order.session.time }}
          </p>
        </div>
      </div>

      <div class="confirmation__row">
        <span>Seats</span>
        <strong>{{ order.tickets.map(ticket => ticket.seatCode).join(", ") }}</strong>
      </div>
      <div class="confirmation__row">
        <span>Tickets</span>
        <span class="confirmation__value">{{
          formatTicketCounts(order.tickets.map(ticket => ticket.ticketType.name))
        }}</span>
      </div>
      <div class="confirmation__row confirmation__row--total">
        <span>Total paid</span>
        <strong>₾{{ order.totalPrice }}</strong>
      </div>
    </div>

    <div class="confirmation__actions">
      <q-btn
        unelevated
        rounded
        no-caps
        label="My Tickets"
        class="confirmation__btn confirmation__btn--primary"
        @click="emit('tickets')"
      />
      <q-btn
        unelevated
        rounded
        no-caps
        label="Close"
        class="confirmation__btn"
        @click="emit('close')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from "@/api/resources/Booking";
import AppIcon from "@/components/ui/AppIcon.vue";
import { formatTicketCounts } from "@/utils/booking";
import { formatDay } from "@/utils/date";

defineProps<{
  order: Order;
}>();

const emit = defineEmits<{
  tickets: [];
  close: [];
}>();
</script>

<style scoped lang="scss">
// Sizes from the Figma "Booking confirmed!" frame
.confirmation {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  padding: 16px 0;

  p {
    margin: 0;
  }
}

// Icon, title, text and order chip: one 365px column, 16px apart
.confirmation__heading {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  width: 365px;
  text-align: center;
}

.confirmation__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: $color-green;
  color: $text-primary;
}

.confirmation__title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
}

.confirmation__text {
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.3;
}

.confirmation__reference {
  padding: 5px 16px;
  border-radius: 999px;
  background: $bg-raised;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-transform: uppercase;
}

.confirmation__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 673px;
  padding: 20px;
  border-radius: 12px;
  background: $bg-card;
}

.confirmation__film {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid $tint-white;
}

.confirmation__poster {
  width: 48px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
}

.confirmation__film-title {
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
}

.confirmation__meta {
  margin-top: 8px !important;
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.confirmation__row {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;

  strong {
    color: $text-primary;
    font-weight: 600;
  }

  &--total {
    padding-top: 12px;
    border-top: 1px solid $tint-white;
    text-transform: uppercase;

    strong {
      font-size: 18px;
      font-weight: 800;
      line-height: 1;
    }
  }
}

.confirmation__value {
  color: $text-primary;
}

.confirmation__actions {
  display: flex;
  gap: 10px;
}

.confirmation__btn {
  min-height: 0;
  height: 41px;
  padding: 0 22px;
  background: $bg-card;
  color: $text-primary;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;

  &--primary {
    background: $color-red;
  }
}
</style>
