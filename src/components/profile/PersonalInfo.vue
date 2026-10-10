<template>
  <form class="info" novalidate @submit.prevent="submit">
    <!-- Booking needs a complete profile (spec 6.1) -->
    <p v-if="user.profileComplete" class="info__status info__status--complete">
      Profile Complete
      <AppIcon name="check" />
    </p>
    <p v-else class="info__status info__status--incomplete">
      Please complete your profile to enable booking.
    </p>

    <div class="info__fields">
      <div class="info__field">
        <label for="profile-full-name" class="info__label">Full name</label>
        <q-input
          v-model="form.fullName"
          for="profile-full-name"
          :rules="fullNameRules"
          :error="!!serverErrors.fullName"
          :error-message="serverErrors.fullName"
          @update:model-value="serverErrors.fullName = ''"
          lazy-rules
          dense
          borderless
          no-error-icon
          hide-bottom-space
          class="info__input"
        />
      </div>

      <div class="info__field">
        <label for="profile-email" class="info__label">Email</label>
        <q-input
          v-model="form.email"
          for="profile-email"
          disable
          dense
          borderless
          class="info__input"
        />
        <p class="info__hint">Set at registration and cannot be changed</p>
      </div>

      <div class="info__field">
        <label for="profile-mobile" class="info__label">Mobile number</label>
        <q-input
          v-model="form.mobileNumber"
          for="profile-mobile"
          type="tel"
          placeholder="5XX XXX XXX"
          :rules="mobileNumberRules"
          :error="!!serverErrors.mobileNumber"
          :error-message="serverErrors.mobileNumber"
          @update:model-value="serverErrors.mobileNumber = ''"
          lazy-rules
          dense
          borderless
          no-error-icon
          hide-bottom-space
          class="info__input"
        />
      </div>

      <div class="info__field">
        <label for="profile-birth-date" class="info__label">Date of birth</label>
        <q-input
          v-model="form.dateOfBirth"
          for="profile-birth-date"
          type="date"
          :rules="dateOfBirthRules"
          :error="!!serverErrors.dateOfBirth"
          :error-message="serverErrors.dateOfBirth"
          @update:model-value="serverErrors.dateOfBirth = ''"
          lazy-rules
          dense
          borderless
          no-error-icon
          hide-bottom-space
          class="info__input"
        />
        <!-- The age comes from the API; it decides which films the user can buy tickets for -->
        <p v-if="user.age != null" class="info__hint">
          You are {{ user.age }}.
          {{
            blockedRatings.length
              ? `You cannot buy tickets for ${blockedRatings.join(" or ")} titles.`
              : "You can buy tickets for every title."
          }}
        </p>
      </div>

      <div class="info__field">
        <label for="profile-venue" class="info__label">Preferred Venue (Optional)</label>
        <div class="info__select">
          <select id="profile-venue" v-model="form.preferredVenueId" class="info__select-native">
            <option :value="null">No preference</option>
            <option
              v-for="venue in filterOptions.options?.venues"
              :key="venue.id"
              :value="venue.id"
            >
              {{ venue.name }} · {{ venue.city }}
            </option>
          </select>
          <AppIcon name="chevron-down" class="info__select-icon"/>
        </div>
      </div>
    </div>

    <p v-if="formError" class="info__alert" role="alert">
      <AppIcon name="alert-circle" />
      {{ formError }}
    </p>

    <q-btn
      type="submit"
      unelevated
      rounded
      no-caps
      label="Save changes"
      class="info__submit"
      :loading="isSubmitting"
      :disable="!isChanged || !isValid"
    />
  </form>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import { isAxiosError } from "axios";
import { api } from "@/boot/axios";
import AppIcon from "@/components/ui/AppIcon.vue";
import type {User} from "@/api/resources/User";
import useAuthStore from "@/stores/useAuthStore";
import useFilterOptionsStore from "@/stores/useFilterOptionsStore";
import {dateOfBirthRules, fullNameRules, mobileNumberRules, passes, toFieldErrors} from "@/utils/validation";

const { user } = defineProps<{
  user: User;
}>();

// Reloads the logged-in user into the store after saving
const { fetchMe } = useAuthStore();

const form = ref({
  fullName: user?.fullName ?? "",
  email: user?.email ?? "",
  mobileNumber: user?.mobileNumber ?? "",
  dateOfBirth: user?.dateOfBirth ?? "",
  preferredVenueId: user?.preferredVenue?.id ?? null
});

// Venues and age ratings come from /filter-options, never hardcoded
const filterOptions = useFilterOptionsStore();

// Ratings the user is too young for, e.g. ["16+", "18+"] for a 14 year old
const blockedRatings = computed(() =>
  (filterOptions.options?.ageRatings ?? [])
    .filter(rating => user.age != null && rating.minAge > user.age)
    .map(rating => rating.code)
);

// "Save changes" is disabled until a field differs from the saved user...
const isChanged = computed(
  () =>
    form.value.fullName !== (user.fullName ?? "") ||
    form.value.mobileNumber !== (user.mobileNumber ?? "") ||
    form.value.dateOfBirth !== (user.dateOfBirth ?? "") ||
    form.value.preferredVenueId !== (user.preferredVenue?.id ?? null)
);

// ...and while any required field is invalid
const isValid = computed(
  () =>
    passes(fullNameRules, form.value.fullName) &&
    passes(mobileNumberRules, form.value.mobileNumber) &&
    passes(dateOfBirthRules, form.value.dateOfBirth)
);

// Set to true while the PUT /profile request is in flight: the button shows a spinner
const isSubmitting = ref(false);

// A non-field error (e.g. server down), shown above the button
const formError = ref("");
// 422 errors from the API, shown on their field ({ mobileNumber: "..." })
const serverErrors = ref<Record<string, string>>({});

// Sent as JSON: there's no avatar on the form, so nothing needs multipart.
// Then fetchMe reloads the user in the store (new profileComplete and age), which updates the `user` prop
const updateProfile = async () => {
  const { fullName, mobileNumber, dateOfBirth, preferredVenueId } = form.value;
  await api.put("/profile", { fullName, mobileNumber, dateOfBirth, preferredVenueId });
  await fetchMe();
};

const submit = async () => {
  // Enter in a field submits too, so check the same things that disable the button
  if (!isChanged.value || !isValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  formError.value = "";
  serverErrors.value = {};

  try {
    await updateProfile();
  } catch (error) {
    const data = isAxiosError(error) ? error.response?.data : undefined;

    if (data?.errors) {
      serverErrors.value = toFieldErrors(data.errors);
      // The venue select has no error slot of its own, so its error goes in the alert
      formError.value = serverErrors.value.preferredVenueId ?? "";
    } else {
      // Network failure or server crash (the API only documents 401 and 422 here)
      formError.value = "Something went wrong. Please try again.";
    }
  } finally {
    isSubmitting.value = false;
  }
};

</script>

<style scoped lang="scss">
.info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 36px;
  width: 884px;
  margin-top: 48px;
}

.info__fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.info__field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info__label {
  color: $text-primary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

// Label turns red when Quasar marks the input below as invalid
.info__field:has(.q-field--error) .info__label {
  color: $color-red;
}

.info__hint {
  margin: -2px 0 0;
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

// q-input's inner elements belong to Quasar, so they need :deep()
.info__input {
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
    // Dark calendar popup and a light picker icon for the date input
    color-scheme: dark;

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

  // Email: read-only, greyed text instead of Quasar's faded field
  &.q-field--disabled {
    :deep(.q-field__control > div) {
      opacity: 1 !important;
    }

    :deep(.q-field__native) {
      color: $text-secondary;
    }
  }
}

// A native <select> styled like the inputs, with our own chevron
.info__select {
  position: relative;
  display: flex;
  align-items: center;
}

.info__select-native {
  width: 100%;
  height: 40px;
  padding: 0 40px 0 16px;
  border: 0;
  border-radius: 12px;
  outline: none;
  background: $bg-card;
  color: $text-primary;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  appearance: none;
  color-scheme: dark;
  cursor: pointer;
}

.info__select-icon {
  position: absolute;
  right: 16px;
  color: $text-secondary;
  pointer-events: none;
}

// Same colours as the status in the profile menu
.info__status {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;

  &--complete {
    background: $tint-green;
    color: $color-green;
  }

  &--incomplete {
    background: $tint-orange;
    color: $color-orange;
  }
}

.info__alert {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: $tint-red;
  color: $color-red;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.info__submit {
  min-height: 0;
  height: 41px;
  padding: 0 22px;
  background: $color-red;
  color: $text-primary;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;

  // Figma's disabled button is a solid grey, not Quasar's faded primary
  &.disabled {
    background: $text-disabled;
    color: $text-secondary;
    opacity: 1 !important;
  }
}
</style>
