<template>
  <div class="checkout">
    <!-- The Pay button sits in the summary column, so it targets this form by id -->
    <form id="checkout-form" class="checkout__form" novalidate @submit.prevent="pay">
      <div
        v-for="field in fields"
        :key="field.key"
        class="checkout__field"
        :class="{ 'checkout__field--wide': field.wide }"
      >
        <label :for="`checkout-${field.key}`" class="checkout__label">{{
          field.label
        }}</label>
        <q-input
          v-model="form[field.key]"
          :for="`checkout-${field.key}`"
          :placeholder="field.placeholder"
          :rules="field.rules"
          :error="fieldErrors[field.key] ? true : undefined"
          :error-message="fieldErrors[field.key]"
          :inputmode="field.numeric ? 'numeric' : undefined"
          :mask="field.mask"
          lazy-rules
          dense
          borderless
          no-error-icon
          hide-bottom-space
          class="checkout__input"
          @update:model-value="delete fieldErrors[field.key]"
        >
          <template #append>
            <AppIcon
              v-if="!fieldErrors[field.key] && passes(field.rules, form[field.key])"
              name="check"
              class="checkout__check"
            />
          </template>
        </q-input>
      </div>
    </form>

    <aside class="checkout__side">
      <h3 class="checkout__heading">Summary</h3>

      <div class="checkout__summary">
        <div>
          <p class="checkout__title">{{ session.movie?.title }}</p>
          <p class="checkout__meta">
            Hall {{ session.hall.name }} · {{ formatDay(session.date) }} ·
            {{ session.time }}
          </p>
        </div>
        <div class="checkout__row">
          <span>Seats</span>
          <span>{{ lines.map(line => line.code).join(", ") }}</span>
        </div>
        <div class="checkout__row">
          <span>Tickets</span>
          <span>{{ ticketCounts }}</span>
        </div>
      </div>

      <div class="checkout__bottom">
        <p v-if="formError" class="checkout__alert" role="alert">
          {{ formError }}
        </p>

        <div class="checkout__total">
          <span>Subtotal</span>
          <strong>₾{{ subtotal }}</strong>
        </div>

        <q-btn
          type="submit"
          form="checkout-form"
          unelevated
          rounded
          no-caps
          label="Pay & Complete Order"
          class="checkout__pay"
          :loading="isSubmitting"
          :disable="!isValid || isSubmitting"
        />

        <!-- Back to step 1 keeps the hold: the user still wants those seats -->
        <q-btn
          flat
          rounded
          no-caps
          label="Back"
          class="checkout__back"
          :disable="isSubmitting"
          @click="emit('back')"
        />
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { isAxiosError } from "axios";
import { computed, ref } from "vue";

import { payOrder } from "@/api/booking";
import type { Order, SeatHold } from "@/api/resources/Booking";
import type { Session } from "@/api/resources/Session";
import { useAuthDialog } from "@/components/auth/useAuthDialog";
import AppIcon from "@/components/ui/AppIcon.vue";
import useAuthStore from "@/stores/useAuthStore";
import { formatTicketCounts } from "@/utils/booking";
import { formatDay } from "@/utils/date";
import {
  cardNumberRules,
  cvvRules,
  emailRules,
  expiryRules,
  fullNameRules,
  mobileNumberRules,
  passes,
  toFieldErrors,
  type Rule
} from "@/utils/validation";

const props = defineProps<{
  session: Session;
  hold: SeatHold;
  lines: { code: string; typeName: string; price: number }[];
  subtotal: number;
}>();

const emit = defineEmits<{
  paid: [order: Order];
  // The hold ran out on the server (422 with only a message)
  expired: [];
  // Someone else bought one of the seats first (409)
  conflict: [codes: string[]];
  back: [];
}>();

const auth = useAuthStore();
const { openLoginDialog } = useAuthDialog();

type Key = "fullName" | "email" | "mobileNumber" | "cardNumber" | "expiry" | "cvv";

// Contact details are prefilled from the profile (spec 5.2)
const form = ref<Record<Key, string>>({
  fullName: auth.user?.fullName ?? "",
  email: auth.user?.email ?? "",
  mobileNumber: auth.user?.mobileNumber ?? "",
  cardNumber: "",
  expiry: "",
  cvv: ""
});

// Laid out in two columns like the Figma; `wide` fields take a whole row.
// `mask` is Quasar's input mask: "#" is one digit, the spaces and "/" are typed in for the user
const fields: {
  key: Key;
  label: string;
  placeholder: string;
  rules: Rule[];
  wide?: boolean;
  numeric?: boolean;
  mask?: string;
}[] = [
  { key: "fullName", label: "Full name", placeholder: "Name Surname", rules: fullNameRules, wide: true },
  { key: "email", label: "Email", placeholder: "example@gmail.com", rules: emailRules },
  { key: "mobileNumber", label: "Mobile number", placeholder: "5XX XXX XXX", rules: mobileNumberRules, numeric: true },
  { key: "cardNumber", label: "Card number", placeholder: "4242 4242 4242 4242", rules: cardNumberRules, wide: true, numeric: true, mask: "#### #### #### ####" },
  { key: "expiry", label: "Expiry", placeholder: "MM/YY", rules: expiryRules, numeric: true, mask: "##/##" },
  { key: "cvv", label: "CVV", placeholder: "123", rules: cvvRules, numeric: true, mask: "###" }
];

const isValid = computed(() =>
  fields.every(field => passes(field.rules, form.value[field.key]))
);

const ticketCounts = computed(() =>
  formatTicketCounts(props.lines.map(line => line.typeName))
);

// 422 field errors from the API, shown on their inputs until the user edits them
const fieldErrors = ref<Partial<Record<Key, string>>>({});
const formError = ref("");
const isSubmitting = ref(false);

const pay = async () => {
  // Disabled button + this guard: a double click can't send two orders
  if (!isValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  formError.value = "";

  try {
    const order = await payOrder({ holdId: props.hold.holdId, ...form.value });
    emit("paid", order);
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    const data = isAxiosError(error) ? error.response?.data : undefined;

    if (status === 401) {
      // Session expired: log in again, then pay with the same details
      openLoginDialog().onOk(pay);
    } else if (status === 422 && data?.errors) {
      fieldErrors.value = toFieldErrors(data.errors);
    } else if (status === 422) {
      emit("expired");
    } else if (status === 409) {
      emit("conflict", data?.contested ?? []);
    } else {
      formError.value = data?.message ?? "Payment failed. Please try again.";
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped lang="scss">
// No box of its own: the form and summary sit in the modal's "main" and "side" grid areas
.checkout {
  display: contents;
}

.checkout__form {
  display: grid;
  grid-area: main;
  grid-template-columns: 1fr 1fr;
  gap: 24px 16px;
  align-content: start;
}

.checkout__field {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &--wide {
    grid-column: 1 / -1;
  }
}

.checkout__label {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.checkout__field:has(.q-field--error) .checkout__label {
  color: $color-red;
}

// Same input as the auth modals (Figma "Input")
.checkout__input {
  :deep(.q-field__control) {
    height: 40px;
    padding: 0 16px;
    border: 1px solid transparent;
    border-radius: 12px;
    background: $bg-card;
  }

  :deep(.q-field__native) {
    color: $text-primary;
    font-size: 12px;
    font-weight: 600;

    &::placeholder {
      color: $text-secondary;
      opacity: 1;
    }
  }

  :deep(.q-field__bottom) {
    padding: 8px 0 0;
    color: $color-red;
    font-size: 12px;
    font-weight: 600;
  }

  &.q-field--error {
    :deep(.q-field__control) {
      border-color: $color-red;
    }

    :deep(.q-field__native) {
      color: $color-red;
    }
  }
}

.checkout__check {
  color: $color-green;
}

.checkout__side {
  display: flex;
  grid-area: side;
  flex-direction: column;
  gap: 12px;
  padding-left: 20px;
  border-left: 1px solid $tint-white;
}

.checkout__heading {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.checkout__summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px;
  border-radius: 16px;
  background: $bg-card;

  p {
    margin: 0;
  }
}

.checkout__title {
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
}

.checkout__meta {
  margin-top: 6px !important;
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.checkout__row {
  display: flex;
  justify-content: space-between;
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;

  span:last-child {
    color: $text-primary;
    font-weight: 600;
  }
}

.checkout__bottom {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: auto;
}

.checkout__alert {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: $tint-red;
  color: $color-red;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.checkout__total {
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

.checkout__pay {
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

.checkout__back {
  min-height: 0;
  margin-top: -8px;
  color: $text-secondary;
  font-size: 14px;
  font-weight: 800;
}
</style>
