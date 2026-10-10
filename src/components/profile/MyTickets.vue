<template>
  <div class="tickets">
    <div class="tickets__switch">
      <button
        type="button"
        class="tickets__filter"
        :class="{ 'tickets__filter--active': filter === 'upcoming' }"
        @click="filter = 'upcoming'"
      >
        Upcoming
        <span v-if="orders" class="tickets__filter-count">{{ upcoming.length }}</span>
      </button>
      <button
        type="button"
        class="tickets__filter"
        :class="{ 'tickets__filter--active': filter === 'past' }"
        @click="filter = 'past'"
      >
        Past
        <span v-if="orders" class="tickets__filter-count">{{ past.length }}</span>
      </button>
    </div>

    <div v-if="hasError" class="tickets__message">
      <p>We couldn't load your tickets.</p>
      <q-btn unelevated rounded no-caps color="primary" label="Try again" @click="reload" />
    </div>

    <div v-else-if="!orders" class="tickets__list" aria-busy="true">
      <q-skeleton v-for="n in 2" :key="n" dark height="183px" class="tickets__skeleton" />
    </div>

    <div v-else-if="!shown.length" class="tickets__message">
      <template v-if="filter === 'upcoming'">
        <p>You have no upcoming tickets.</p>
        <q-btn unelevated rounded no-caps color="primary" label="Browse sessions" :to="{ name: 'sessions' }" />
      </template>
      <p v-else>You have no past tickets yet.</p>
    </div>

    <div v-else class="tickets__list">
      <article v-for="order in shown" :key="order.id" class="ticket">
        <div class="ticket__main">
          <img
            :src="order.session.movie?.posterUrl ?? undefined"
            :alt="order.session.movie?.title"
            class="ticket__poster"
          />

          <div class="ticket__details">
            <div class="ticket__title-row">
              <h3 class="ticket__title">{{ order.session.movie?.title }}</h3>
              <span class="ticket__rating">{{ order.session.movie?.ageRating.code }}</span>
              <span class="ticket__runtime">{{ order.session.movie?.runtimeMinutes }} min</span>
            </div>

            <div class="ticket__meta">
              <div class="ticket__field">
                <span class="ticket__label">Date</span>
                <span class="ticket__value">
                  {{ formatDay(order.session.date) }} · {{ order.session.time }}
                </span>
              </div>
              <div class="ticket__field">
                <span class="ticket__label">Venue</span>
                <span class="ticket__value">
                  {{ order.session.venue.name }} · Hall {{ order.session.hall.name }}
                </span>
              </div>
              <div class="ticket__field">
                <span class="ticket__label">Format</span>
                <span class="ticket__value">
                  {{ order.session.format.name }} · {{ order.session.language.name }}
                </span>
              </div>
            </div>

            <div class="ticket__seats">
              <span class="ticket__label">Seats</span>
              <span v-for="ticket in order.tickets" :key="ticket.id" class="ticket__seat">
                {{ ticket.seatCode }} · {{ ticket.ticketType.name }}
              </span>
            </div>
          </div>
        </div>

        <!-- The tear-off part of the ticket, behind a dashed line -->
        <div class="ticket__stub">
          <div class="ticket__order">
            <span class="ticket__label">Order</span>
            <span class="ticket__reference">#{{ order.reference }}</span>
          </div>

          <div class="ticket__bottom">
            <div class="ticket__total">
              <span>Total paid</span>
              <strong class="ticket__price">₾{{ order.totalPrice }}</strong>
            </div>

            <!-- Past tickets have no actions (spec 6.2). The span carries the tooltip,
                 because a disabled button doesn't react to hover -->
            <span v-if="order.isUpcoming" class="ticket__refund-wrap">
              <q-btn
                unelevated
                rounded
                no-caps
                label="Refund"
                class="ticket__refund"
                :disable="!order.isRefundable"
                :loading="refundingId === order.id"
                @click="confirmRefund(order)"
              />
              <q-tooltip v-if="!order.isRefundable">
                Refunds close 2 hours before the session starts
              </q-tooltip>
            </span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isAxiosError } from "axios";
import { useQuasar } from "quasar";
import { computed, ref } from "vue";
import { api } from "@/boot/axios";
import type { Order } from "@/api/resources/Booking";
import { formatDay } from "@/utils/date";

const { dialog } = useQuasar();

const { orders, hasError, reload } = defineProps<{
  // null while the first load is running
  orders: Order[] | null;
  hasError: boolean;
  // Loads the orders again (passed from ProfilePage, which owns them)
  reload: () => Promise<void>;
}>();

const filter = ref<"upcoming" | "past">("upcoming");

const upcoming = computed(() => (orders ?? []).filter(order => order.isUpcoming));
const past = computed(() => (orders ?? []).filter(order => !order.isUpcoming));
const shown = computed(() => (filter.value === "upcoming" ? upcoming.value : past.value));


// The order whose refund request is in flight: its button shows a spinner
const refundingId = ref<number | null>(null);

const refund = async (order: Order) => {
  refundingId.value = order.id;

  try {
    // The API finds the order by its reference ("KX-7QF2LD"), not its numeric id
    await api.post(`/orders/${order.reference}/refund`);
    // Reload from the server instead of moving the card ourselves: it lands in Past as the API says
    await reload();
  } catch (error) {
    // 422: refused (already refunded, or inside the 2 hour cutoff); the API's message says which
    const message =
      isAxiosError(error) && error.response?.status === 422
        ? error.response.data.message
        : "Something went wrong. Please try again.";

    dialog({ title: "Refund failed", message, dark: true });
  } finally {
    refundingId.value = null;
  }
};

// A refund can't be undone, so ask first
const confirmRefund = (order: Order) => {
  const count = order.tickets.length;

  dialog({
    title: "Refund tickets?",
    message: `Refund ${count} ${count === 1 ? "ticket" : "tickets"} for ${order.session.movie?.title} (₾${order.totalPrice})? This can't be undone.`,
    dark: true,
    cancel: { label: "Cancel", flat: true, noCaps: true, color: "white" },
    ok: { label: "Refund", unelevated: true, rounded: true, noCaps: true, color: "primary" }
  }).onOk(() => void refund(order));
};
</script>

<style scoped lang="scss">
.tickets {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  margin-top: 36px;
}

// Upcoming / Past
.tickets__switch {
  display: flex;
  padding: 5px;
  border-radius: 12px;
  background: $bg-card;
}

.tickets__filter {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 7px 14px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: $text-secondary;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;

  &--active {
    background: $bg-raised;
    color: $text-primary;
  }
}

.tickets__filter-count {
  color: $text-disabled;
  font-size: 12px;

  .tickets__filter--active & {
    color: $text-primary;
  }
}

.tickets__list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.tickets__skeleton {
  border-radius: 26px;
}

.tickets__message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 60px 0;
  color: $text-secondary;
  font-size: 14px;

  p {
    margin: 0;
  }
}

// One order
.ticket {
  display: flex;
  min-height: 183px;
  overflow: hidden;
  border-radius: 26px;
  background: $bg-card;
}

.ticket__main {
  display: flex;
  flex: 1;
  gap: 18px;
  align-items: center;
  min-width: 0;
  padding: 0 30px;
}

.ticket__poster {
  flex-shrink: 0;
  width: 100px;
  height: 133px;
  border-radius: 10px;
  object-fit: cover;
}

.ticket__details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.ticket__title-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.ticket__title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.ticket__rating {
  padding: 3px 8px;
  border-radius: 999px;
  background: $tint-red;
  color: $color-red;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.ticket__runtime {
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.3;
}

.ticket__meta {
  display: flex;
  gap: 40px;
}

.ticket__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

// "DATE", "VENUE", "SEATS", "ORDER"
.ticket__label {
  color: $text-secondary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ticket__value,
.ticket__reference {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.ticket__seats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.ticket__seat {
  padding: 4px 10px;
  border-radius: 6px;
  background: $tint-white;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.ticket__stub {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  justify-content: space-between;
  gap: 16px;
  width: 300px;
  padding: 20px 24px;
  border-left: 1px dashed $bg-raised;
}

.ticket__order {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ticket__bottom {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ticket__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: $text-secondary;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.ticket__price {
  color: $text-primary;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
}

// Grid, so the button inside still takes the full width
.ticket__refund-wrap {
  display: grid;
}

.ticket__refund {
  min-height: 0;
  height: 35px;
  padding: 0 22px;
  background: $tint-white;
  color: $text-primary;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;

  // Figma's disabled Refund is the same button at 20% opacity
  &.disabled {
    opacity: 0.2 !important;
  }
}
</style>
