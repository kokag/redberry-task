<template>
  <q-dialog ref="dialogRef" @hide="onHide">
    <div class="booking">
      <BookingConfirmation
        v-if="order"
        :order="order"
        @tickets="goToTickets"
        @close="onDialogCancel"
      />

      <div v-else-if="isLoading" class="booking__state" aria-busy="true">
        <q-spinner color="primary" size="40px" />
      </div>

      <div v-else-if="hasError || !session || !seatMap" class="booking__state">
        <p>We couldn't load this session.</p>
        <q-btn unelevated rounded no-caps color="primary" label="Try again" @click="load" />
      </div>

      <template v-else>
        <!-- Always visible: session info, hold timer, close -->
        <header class="booking__header">
          <div>
            <h2 class="booking__title">{{ session.movie?.title }}</h2>
            <p class="booking__info">{{ sessionInfo }}</p>
          </div>

          <div class="booking__header-side">
            <div v-if="hold" class="booking__timer">
              <span>Seats held</span>
              <strong>{{ timerLabel }}</strong>
            </div>
            <button v-close-popup type="button" class="booking__close" aria-label="Close">
              <AppIcon name="close" :size="24" />
            </button>
          </div>
        </header>

        <div class="booking__body">
          <!-- Step indicator: 1. Seats → 2. Checkout; "Seats" doubles as a way back -->
          <div class="booking__steps">
            <button
              type="button"
              class="booking__step"
              :class="{ 'booking__step--active': step === 'seats' }"
              @click="step = 'seats'"
            >
              1. Seats
            </button>
            <span
              class="booking__step"
              :class="{ 'booking__step--active': step === 'checkout' }"
              >2. Checkout</span
            >
          </div>

          <template v-if="step === 'seats'">
            <div class="booking__main">
              <p v-if="notice" class="booking__notice" role="alert">{{ notice }}</p>
              <SeatMap
                :map="seatMap"
                :selected-ids="selection.map(item => item.seat.id)"
                @toggle="toggleSeat"
              />
            </div>

            <aside class="booking__side">
              <h3 class="booking__heading">Your seats · Max {{ maxSeats }}</h3>

              <p v-if="!selection.length" class="booking__hint">
                Pick up to {{ maxSeats }} seats from the map. Each seat can carry
                its own ticket type.
              </p>

              <!-- Cards slide in when a seat is picked and out when it's removed -->
              <TransitionGroup name="seat-card" tag="div" class="booking__seats">
                <div v-for="(item, index) in selection" :key="item.seat.id" class="booking__seat">
                  <div class="booking__seat-head">
                    <span><span class="booking__muted">Seat</span> {{ item.seat.code }}</span>
                    <span class="booking__seat-price">
                      ₾{{ lines[index]?.price }}
                      <button
                        type="button"
                        class="booking__remove"
                        :aria-label="`Remove seat ${item.seat.code}`"
                        @click="toggleSeat(item.seat)"
                      >
                        <AppIcon name="close" />
                      </button>
                    </span>
                  </div>

                  <div class="booking__types">
                    <button
                      v-for="type in ticketTypes"
                      :key="type.slug"
                      type="button"
                      class="booking__type"
                      :class="{ 'booking__type--active': item.ticketType === type.slug }"
                      @click="item.ticketType = type.slug"
                    >
                      {{ type.name }} {{ Math.round(type.priceRatio * 100) }}%
                    </button>
                  </div>
                </div>
              </TransitionGroup>

              <!-- Why "Next" is disabled: broken ticket rules (per seat), age, profile -->
              <ul v-if="blockers.length" class="booking__errors">
                <li v-for="blocker in blockers" :key="blocker">{{ blocker }}</li>
              </ul>

              <div class="booking__total">
                <span>Subtotal</span>
                <strong>₾{{ subtotal }}</strong>
              </div>

              <q-btn
                unelevated
                rounded
                no-caps
                label="Next: Checkout"
                class="booking__next"
                :loading="isHolding"
                :disable="!selection.length || blockers.length > 0 || isHolding"
                @click="goToCheckout"
              />
            </aside>
          </template>

          <CheckoutStep
            v-else-if="hold"
            :session="session"
            :hold="hold"
            :lines="lines"
            :subtotal="subtotal"
            @paid="onPaid"
            @expired="expire"
            @conflict="onConflict"
            @back="step = 'seats'"
          />
        </div>
      </template>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { isAxiosError } from "axios";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { fetchSeatMap, fetchSession, holdSeats, releaseHold } from "@/api/booking";
import type { Order, Seat, SeatHold, SeatMap as Map } from "@/api/resources/Booking";
import type { Session } from "@/api/resources/Session";
import { useAuthDialog } from "@/components/auth/useAuthDialog";
import BookingConfirmation from "@/components/booking/BookingConfirmation.vue";
import CheckoutStep from "@/components/booking/CheckoutStep.vue";
import SeatMap from "@/components/booking/SeatMap.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import useAuthStore from "@/stores/useAuthStore";
import useFilterOptionsStore from "@/stores/useFilterOptionsStore";
import { formatDay } from "@/utils/date";

const props = defineProps<{
  sessionId: number;
}>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const { notify } = useQuasar();

const router = useRouter();
const auth = useAuthStore();
const filterOptions = useFilterOptionsStore();
const { openLoginDialog } = useAuthDialog();

// Max seats and ticket types come from /filter-options, never hardcoded
const maxSeats = computed(() => filterOptions.options?.maxSeatsPerOrder ?? 0);
const ticketTypes = computed(() => filterOptions.options?.ticketTypes ?? []);

const session = ref<Session | null>(null);
const seatMap = ref<Map | null>(null);
const isLoading = ref(true);
const hasError = ref(false);

const step = ref<"seats" | "checkout">("seats");
const selection = ref<{ seat: Seat; ticketType: string }[]>([]);
const hold = ref<SeatHold | null>(null);
const order = ref<Order | null>(null);
// One message line above the map: seats lost to someone else, hold expired, hold refused
const notice = ref("");
const isHolding = ref(false);

// ---- Loading ----

const loadMap = async () => {
  seatMap.value = await fetchSeatMap(props.sessionId);
};

const load = async () => {
  isLoading.value = true;
  hasError.value = false;

  try {
    if (!filterOptions.options) await filterOptions.load();
    const [loaded] = await Promise.all([fetchSession(props.sessionId), loadMap()]);
    session.value = loaded;
  } catch {
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};

// The map is fetched fresh every time the modal opens
onMounted(load);

// "Galleria Tbilisi · Hall B · Tuesday 15 September · 16:30 · Standard · Original + Subtitles"
const sessionInfo = computed(() => {
  if (!session.value) return "";
  const { venue, hall, date, time, format, language } = session.value;
  return [
    venue.name,
    `Hall ${hall.name}`,
    formatDay(date, "dddd D MMMM"),
    time,
    format.name,
    language.name
  ].join(" · ");
});

// ---- Step 1: seats ----

const toggleSeat = (seat: Seat) => {
  notice.value = "";
  const index = selection.value.findIndex(item => item.seat.id === seat.id);

  if (index >= 0) {
    selection.value.splice(index, 1);
  } else if (selection.value.length >= maxSeats.value) {
    // A short toast at the bottom (like the reference GIF): the selection itself is fine, nothing to fix
    notify({
      message: `You can select up to ${maxSeats.value} seats per order.`,
      position: "bottom",
      classes: "booking-toast",
      timeout: 2500
    });
  } else {
    // Every new seat starts as Adult (spec 5.1)
    selection.value.push({ seat, ticketType: "adult" });
  }
};

const typeOf = (slug: string) => ticketTypes.value.find(type => type.slug === slug);

// Money in lari; ratios like 0.6 can leave long decimals, so round to tetri
const round = (value: number) => Math.round(value * 100) / 100;

// One line per seat for the summary: code, ticket type, price
const lines = computed(() =>
  selection.value.map(item => {
    const type = typeOf(item.ticketType);
    return {
      code: item.seat.code,
      typeName: type?.name ?? item.ticketType,
      price: round((session.value?.price ?? 0) * (type?.priceRatio ?? 1))
    };
  })
);

const subtotal = computed(() => round(lines.value.reduce((sum, line) => sum + line.price, 0)));

// Everything that blocks "Next: Checkout", written for the user
const blockers = computed(() => {
  const minAge = session.value?.movie?.ageRating.minAge ?? 0;
  const messages: string[] = [];

  // e.g. a Child ticket on a 16+ film: name the seat and the reason
  selection.value.forEach(item => {
    const type = typeOf(item.ticketType);
    if (type?.blockedFromRatingAge != null && minAge >= type.blockedFromRatingAge) {
      messages.push(`${item.seat.code}: ${type.name} tickets — ${type.note}`);
    }
  });

  const age = auth.user?.age;
  if (age != null && age < minAge) {
    messages.push(
      `This film is rated ${session.value?.movie?.ageRating.code}. You cannot buy tickets for it with this account.`
    );
  }

  if (auth.user && !auth.user.profileComplete) {
    messages.push("Please complete your profile to enable booking.");
  }

  return messages;
});

// ---- Hold timer ----

const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;

// Counted from the server's expiresAt, so a slow or background tab doesn't drift
const secondsLeft = computed(() =>
  hold.value ? Math.max(0, Math.ceil((Date.parse(hold.value.expiresAt) - now.value) / 1000)) : 0
);

const timerLabel = computed(
  () => `${Math.floor(secondsLeft.value / 60)}:${String(secondsLeft.value % 60).padStart(2, "0")}`
);

const stopTimer = () => clearInterval(timer);

const startTimer = () => {
  stopTimer();
  now.value = Date.now();
  timer = setInterval(() => {
    now.value = Date.now();
    if (secondsLeft.value === 0) expire();
  }, 1000);
};

// Timer at zero, or the server says the hold ran out: start over from a fresh map (spec 5.3)
const expire = () => {
  stopTimer();
  hold.value = null;
  selection.value = [];
  step.value = "seats";
  notice.value = "Your hold time expired. Please re-select your seats.";
  void loadMap();
};

// ---- Step 1 → 2 ----

// 409: someone took seats first. Name them, mark them sold, drop them, keep the rest, refetch.
// The hold is gone too, so its timer stops (it would later say "expired" for nothing)
const onConflict = (codes: string[]) => {
  stopTimer();
  hold.value = null;
  notice.value = `Sorry, ${codes.join(", ")} ${codes.length === 1 ? "was" : "were"} just taken by someone else. Your other seats are still selected.`;

  seatMap.value?.sections.forEach(section =>
    section.rows.forEach(row =>
      row.seats.forEach(seat => {
        if (codes.includes(seat.code)) seat.state = "sold";
      })
    )
  );

  selection.value = selection.value.filter(item => !codes.includes(item.seat.code));
  step.value = "seats";
  void loadMap();
};

const goToCheckout = async () => {
  isHolding.value = true;
  notice.value = "";

  try {
    hold.value = await holdSeats(
      props.sessionId,
      selection.value.map(item => ({ seatId: item.seat.id, ticketType: item.ticketType }))
    );
    step.value = "checkout";
    startTimer();
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    const data = isAxiosError(error) ? error.response?.data : undefined;

    if (status === 401) {
      // Logged out meanwhile: log in, then hold the same seats
      openLoginDialog().onOk(goToCheckout);
    } else if (status === 409) {
      onConflict(data?.contested ?? []);
    } else {
      // 422 booking rules (profile, age, session started) come with a message written for the user
      notice.value = data?.message ?? "We couldn't hold your seats. Please try again.";
    }
  } finally {
    isHolding.value = false;
  }
};

// ---- Done / closing ----

const onPaid = (paid: Order) => {
  stopTimer();
  order.value = paid;
};

const goToTickets = () => {
  onDialogCancel();
  void router.push({ name: "profile", query: { tab: "tickets" } });
};

// Closed without paying: give the seats back now instead of after 8 minutes
const onHide = () => {
  stopTimer();
  if (hold.value && !order.value) void releaseHold(hold.value.holdId).catch(() => undefined);
  onDialogHide();
};
</script>

<style lang="scss">
// QNotify teleports to <body>, so the toast can't be styled from the scoped block.
// A dark pill like the reference: card background, white 14px text
.q-notification.booking-toast {
  min-height: 0;
  padding: 14px 24px;
  border-radius: 16px;
  background: $bg-card;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  color: $text-primary;
  font-size: 14px;
  line-height: 1.3;
}
</style>

<style scoped lang="scss">
// Figma "Seat Selection": 1146 wide, radius 28, padding 32, gap 32
.booking {
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 1146px;
  max-width: none !important;
  padding: 32px;
  border-radius: 28px;
  background: $bg-page;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.2);
  color: $text-primary;

  p {
    margin: 0;
  }
}

.booking__state {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: $text-secondary;
}

.booking__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.booking__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
}

.booking__info,
.booking__hint {
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.booking__header-side {
  display: flex;
  gap: 16px;
  align-items: center;
}

.booking__timer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  padding: 8px 14px;
  border-radius: 12px;
  background: $bg-card;

  span {
    color: $text-secondary;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    text-transform: uppercase;
  }

  strong {
    font-size: 18px;
    font-weight: 800;
    line-height: 1;
  }
}

.booking__close {
  display: flex;
  padding: 0;
  border: 0;
  background: none;
  color: $text-primary;
  cursor: pointer;
}

// Left column 720px (steps over the main content), right column the rest.
// CheckoutStep's root is display: contents, so its form and summary land in the same areas
.booking__body {
  display: grid;
  grid-template-columns: 720px 1fr;
  grid-template-areas:
    "steps side"
    "main side";
  grid-template-rows: auto 1fr;
  gap: 32px 20px;
}

.booking__steps {
  display: flex;
  grid-area: steps;
  gap: 8px;
  border-radius: 999px;
  background: $bg-card;
}

.booking__step {
  flex: 1;
  padding: 10px 16px;
  border: 0;
  border-radius: 999px;
  background: none;
  color: $text-primary;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 13px;
  text-align: center;
  text-transform: uppercase;

  &--active {
    background: $color-red;
  }
}

button.booking__step:not(.booking__step--active) {
  cursor: pointer;
}

.booking__main {
  display: flex;
  grid-area: main;
  flex-direction: column;
  gap: 16px;
}

.booking__notice {
  padding: 10px 12px;
  border-radius: 10px;
  background: $tint-orange;
  color: $color-orange;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.booking__side {
  display: flex;
  grid-area: side;
  flex-direction: column;
  gap: 12px;
  padding-left: 20px;
  border-left: 1px solid $tint-white;
}

.booking__heading {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.booking__seats {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
}

// <TransitionGroup name="seat-card"> classes: slide in from the right, slide out the same way,
// and the cards below glide up into the gap
.seat-card-enter-active,
.seat-card-leave-active,
.seat-card-move {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.seat-card-enter-from,
.seat-card-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

@media (prefers-reduced-motion: reduce) {
  .seat-card-enter-active,
  .seat-card-leave-active,
  .seat-card-move {
    transition: none;
  }
}

// Figma "Seat" card: radius 16, padding 15
.booking__seat {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px;
  border-radius: 16px;
  background: $bg-card;
}

.booking__seat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid $tint-white;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.booking__muted {
  margin-right: 8px;
  color: $text-secondary;
  text-transform: uppercase;
}

.booking__seat-price {
  display: flex;
  gap: 12px;
  align-items: center;
}

.booking__remove {
  display: flex;
  padding: 0;
  border: 0;
  background: none;
  color: $text-secondary;
  cursor: pointer;
}

.booking__types {
  display: flex;
  gap: 8px;
}

.booking__type {
  flex: 1;
  padding: 8px 0;
  border: 0;
  border-radius: 16px;
  background: $bg-raised;
  color: $text-primary;
  font: inherit;
  font-size: 12px;
  line-height: 1.3;
  cursor: pointer;

  &--active {
    background: $color-red;
  }
}

.booking__errors {
  margin: 0;
  padding: 10px 12px 10px 28px;
  border-radius: 10px;
  background: $tint-red;
  color: $color-red;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.booking__total {
  display: flex;
  align-items: center;
  justify-content: space-between;

  span {
    color: $text-secondary;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }

  strong {
    font-size: 24px;
    font-weight: 800;
    line-height: 1;
  }
}

.booking__next {
  min-height: 0;
  height: 41px;
  background: $color-red;
  color: $text-primary;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;

  &.disabled {
    background: $text-disabled;
    color: $text-secondary;
    opacity: 1 !important;
  }
}
</style>
