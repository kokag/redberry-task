<template>
  <form class="info" novalidate @submit.prevent>
    <div class="info__fields">
      <div class="info__field">
        <label for="profile-full-name" class="info__label">Full name</label>
        <q-input
          v-model="form.fullName"
          for="profile-full-name"
          :rules="fullNameRules"
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
          lazy-rules
          dense
          borderless
          no-error-icon
          hide-bottom-space
          class="info__input"
        />
      </div>

      <div class="info__field">
        <label for="profile-venue" class="info__label">Preferred Venue (Optional)</label>
        <div class="info__select">
          <select id="profile-venue" v-model="form.preferredVenueId" class="info__select-native">
            <option :value="null">No preference</option>
          </select>
          <AppIcon name="chevron-down" class="info__select-icon"/>
        </div>
      </div>
    </div>

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
import AppIcon from "@/components/ui/AppIcon.vue";
import type {User} from "@/api/resources/User";
import {dateOfBirthRules, fullNameRules, mobileNumberRules, passes} from "@/utils/validation";

const {user} = defineProps<{
  user: User;
}>()

const form = ref({
  fullName: user?.fullName ?? "",
  email: user?.email ?? "",
  mobileNumber: user?.mobileNumber ?? "",
  dateOfBirth: user?.dateOfBirth ?? "",
  preferredVenueId: null
});

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
