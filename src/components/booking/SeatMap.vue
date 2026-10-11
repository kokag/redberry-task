<template>
  <div class="seat-map">
    <div class="seat-map__screen">Screen</div>

    <!-- Every section is its own block: sections have different widths, so they're never merged into one grid -->
    <section
      v-for="(section, sectionIndex) in map.sections"
      :key="section.name"
      class="seat-map__section"
    >
      <h3 class="seat-map__section-name">
        {{ section.name }} · Rows {{ section.rows[0]?.label }}–{{
          section.rows.at(-1)?.label
        }}
      </h3>

      <div
        v-for="(row, rowIndex) in section.rows"
        :key="row.label"
        class="seat-map__row"
      >
        <!-- Labels come from the data: some halls skip letters -->
        <span class="seat-map__row-label">{{ row.label }}</span>

        <template v-for="(seat, seatIndex) in row.seats" :key="seat.id">
          <!-- "unavailable" is a gap in the plan, not a seat -->
          <span
            v-if="seat.state === 'unavailable'"
            class="seat-map__gap"
          />
          <button
            v-else
            type="button"
            class="seat"
            :class="`seat--${selectedIds.includes(seat.id) ? 'selected' : seatState(seat)}`"
            :disabled="seatState(seat) !== 'available'"
            :aria-pressed="selectedIds.includes(seat.id)"
            :aria-label="`Seat ${seat.code}`"
            :style="{
              animationDelay: entranceDelay(
                sectionIndex,
                rowIndex,
                seatIndex,
                row.seats.length
              )
            }"
            @click="emit('toggle', seat)"
          >
            {{ seat.label }}
          </button>

          <span v-if="seat.aisleAfter" class="seat-map__aisle" />
        </template>
      </div>
    </section>

    <ul class="seat-map__legend">
      <li><span class="seat seat--available" />Available</li>
      <li><span class="seat seat--selected" />Selected</li>
      <li><span class="seat seat--sold" />Sold</li>
      <li><span class="seat seat--held" />Held by another user</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Seat, SeatMap } from "@/api/resources/Booking";

defineProps<{
  map: SeatMap;
  selectedIds: number[];
}>();

const emit = defineEmits<{
  toggle: [seat: Seat];
}>();

// The user's own live hold counts as free for them, so they can keep or change it
const seatState = (seat: Seat) => (seat.isMine ? "available" : seat.state);

// Entrance wave when the map first shows: row after row, each row spreading out from its middle.
// Seats keep their keys on a refetch, so the wave only plays once
const entranceDelay = (
  sectionIndex: number,
  rowIndex: number,
  seatIndex: number,
  rowLength: number
) => {
  const fromMiddle = Math.abs(seatIndex - (rowLength - 1) / 2);
  return `${sectionIndex * 150 + rowIndex * 50 + fromMiddle * 25}ms`;
};
</script>

<style scoped lang="scss">
.seat-map {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.seat-map__screen {
  padding: 8px;
  border-radius: 0 0 999px 999px;
  background: $bg-card;
  color: $text-primary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  text-transform: uppercase;
}

.seat-map__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seat-map__section-name {
  margin: 0;
  color: $text-secondary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
}

.seat-map__row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.seat-map__row-label {
  width: 24px;
  color: $text-primary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.seat-map__gap {
  width: 36px;
}

// A gangway: 24px on top of the normal 8px gaps
.seat-map__aisle {
  width: 24px;
}

// Smaller than Figma's 52px so the widest hall (14 seats, 2 aisles) fits the 720px column
// and the whole map shows without scrolling
.seat {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid $text-disabled;
  border-radius: 8px;
  background: $bg-card;
  color: $text-primary;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  // Selecting a seat fades to red instead of snapping
  transition:
    background-color 0.2s,
    border-color 0.2s;

  &:hover:not(:disabled) {
    border-color: $text-secondary;
  }

  &--selected {
    border-color: $bg-page;
    background: $color-red;
  }

  &--sold,
  &--held {
    border-color: transparent;
    color: $text-disabled;
    cursor: not-allowed;
  }

  // Someone else's hold: striped, so it reads differently from sold
  &--held {
    background: repeating-linear-gradient(
        135deg,
        rgba($text-primary, 0.1) 0 8px,
        transparent 8px 16px
      ),
      $bg-card;
  }
}

.seat-map__legend {
  display: flex;
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    gap: 8px;
    align-items: center;
    color: $text-secondary;
    font-size: 14px;
    line-height: 1.3;
  }

  .seat {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    cursor: default;
  }
}

// Each seat fades and grows in after its own delay (set inline by entranceDelay).
// "backwards" keeps it hidden while it waits for its turn
.seat-map__row .seat {
  animation: seat-in 0.35s ease-out backwards;
}

@keyframes seat-in {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}

@media (prefers-reduced-motion: reduce) {
  .seat-map__row .seat {
    animation: none;
  }
}
</style>
