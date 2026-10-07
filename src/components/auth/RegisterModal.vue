<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <AppModal title="Sign up" subtitle="Welcome to Kino XII" style="width: 475px">
      <form class="register" novalidate @submit.prevent="submit">
        <div class="register__fields">
          <!-- Avatar: the row is Figma's design; clicking it opens the hidden q-file's file picker -->
          <div class="register__field">
            <button type="button" class="register__avatar" @click="avatarPicker?.pickFiles()">
              <img v-if="avatarPreview" :src="avatarPreview" alt="" class="register__avatar-image" />
              <span v-else class="register__avatar-image register__avatar-image--empty">
                <AppIcon name="user" />
              </span>

              <span class="register__avatar-text">
                <span class="register__avatar-title">Upload avatar (optional)</span>
                <span class="register__avatar-hint">JPG, PNG or WEBP</span>
              </span>
            </button>

            <!-- Quasar checks the type and size, and fires @rejected for anything else -->
            <q-file
              ref="avatarPicker"
              v-model="registerForm.avatar"
              accept=".jpg,.jpeg,.png,.webp"
              :max-file-size="2 * 1024 * 1024"
              style="display: none"
              @rejected="avatarError = 'Please upload a JPG, PNG or WEBP image up to 2MB'"
              @update:model-value="avatarError = ''"
            />
            <p v-if="avatarError" class="register__error">{{ avatarError }}</p>
          </div>

          <div class="register__field">
            <label for="register-username" class="register__label">Username</label>
            <q-input
              ref="usernameInput"
              v-model="registerForm.username"
              for="register-username"
              placeholder="User"
              :rules="usernameRules"
              :error="!!serverErrors.username"
              :error-message="serverErrors.username"
              lazy-rules
              dense
              borderless
              no-error-icon
              hide-bottom-space
              class="register__input"
              @update:model-value="serverErrors.username = ''"
            >
              <template #append>
                <AppIcon v-if="usernameInput?.hasError" name="alert-circle" class="register__icon--error" />
                <AppIcon
                  v-else-if="passes(usernameRules, registerForm.username)"
                  name="check"
                  class="register__icon--valid"
                />
              </template>
            </q-input>
          </div>

          <div class="register__field">
            <label for="register-email" class="register__label">Email</label>
            <q-input
              ref="emailInput"
              v-model="registerForm.email"
              for="register-email"
              type="email"
              placeholder="example@gmail.com"
              :rules="emailRules"
              :error="!!serverErrors.email"
              :error-message="serverErrors.email"
              lazy-rules
              dense
              borderless
              no-error-icon
              hide-bottom-space
              class="register__input"
              @update:model-value="serverErrors.email = ''"
            >
              <template #append>
                <AppIcon v-if="emailInput?.hasError" name="alert-circle" class="register__icon--error" />
                <AppIcon
                  v-else-if="passes(emailRules, registerForm.email)"
                  name="check"
                  class="register__icon--valid"
                />
              </template>
            </q-input>
          </div>

          <!-- Password and Confirm password sit side by side in Figma -->
          <div class="register__row">
            <div class="register__field">
              <label for="register-password" class="register__label">Password</label>
              <q-input
                ref="passwordInput"
                v-model="registerForm.password"
                for="register-password"
                type="password"
                placeholder="••••••••"
                :rules="passwordRules"
                :error="!!serverErrors.password"
                :error-message="serverErrors.password"
                lazy-rules
                dense
                borderless
                no-error-icon
                hide-bottom-space
                class="register__input"
                @update:model-value="serverErrors.password = ''"
              >
                <template #append>
                  <AppIcon v-if="passwordInput?.hasError" name="alert-circle" class="register__icon--error" />
                  <AppIcon
                    v-else-if="passes(passwordRules, registerForm.password)"
                    name="check"
                    class="register__icon--valid"
                  />
                </template>
              </q-input>
            </div>

            <div class="register__field">
              <label for="register-confirm" class="register__label">Confirm password</label>
              <q-input
                ref="confirmInput"
                v-model="registerForm.password_confirmation"
                for="register-confirm"
                type="password"
                placeholder="••••••••"
                :rules="confirmRules"
                lazy-rules
                dense
                borderless
                no-error-icon
                hide-bottom-space
                class="register__input"
              >
                <template #append>
                  <AppIcon v-if="confirmInput?.hasError" name="alert-circle" class="register__icon--error" />
                  <AppIcon
                    v-else-if="passes(confirmRules, registerForm.password_confirmation)"
                    name="check"
                    class="register__icon--valid"
                  />
                </template>
              </q-input>
            </div>
          </div>
        </div>

        <div class="register__actions">
          <p v-if="formError" class="register__alert" role="alert">
            <AppIcon name="alert-circle" />
            {{ formError }}
          </p>

          <q-btn
            type="submit"
            unelevated
            rounded
            no-caps
            label="Sign up"
            class="register__submit"
            :loading="isSubmitting"
            :disable="!isValid"
          />

          <p class="register__switch">
            Already have an account?
            <button type="button" class="register__link" @click="goToLogin">Log in</button>
          </p>
        </div>
      </form>
    </AppModal>
  </q-dialog>
</template>

<script setup lang="ts">
import { isAxiosError } from "axios";
import { useDialogPluginComponent, type QFile, type QInput } from "quasar";
import { computed, ref } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import AppModal from "@/components/ui/AppModal.vue";
import useAuthStore, { type RegisterPayload } from "@/stores/usaAuthStore";
import { emailRules, passes, passwordRules, type Rule } from "@/utils/validation";
import { useAuthDialog } from "@/components/auth/useAuthDialog";

// Required by $q.dialog({ component }): dialogRef goes on the q-dialog, onDialogOK closes it
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
const { openLoginDialog } = useAuthDialog();

// "Log in" link: close this dialog and open the login one
const goToLogin = () => {
  onDialogCancel();
  openLoginDialog();
};

const auth = useAuthStore();
const registerForm = ref<RegisterPayload>({
  username: "",
  email: "",
  password: "",
  password_confirmation: "",
  avatar: null
});

const usernameRules: Rule[] = [
  val => !!val || "Username is required",
  val => val.length >= 3 || "At least 3 characters"
];

const confirmRules: Rule[] = [
  val => !!val || "Please confirm your password",
  val => val === registerForm.value.password || "Passwords do not match"
];

// Template refs, so the icons can read Quasar's `hasError`
const usernameInput = ref<QInput | null>(null);
const emailInput = ref<QInput | null>(null);
const passwordInput = ref<QInput | null>(null);
const confirmInput = ref<QInput | null>(null);

// Avatar: optional, jpg/png/webp up to 2MB (API limit)
const avatarPicker = ref<QFile | null>(null);
const avatarError = ref("");

// Preview URL for the chosen file
const avatarPreview = computed(() =>
  registerForm.value.avatar ? URL.createObjectURL(registerForm.value.avatar) : ""
);

// The Sign up button stays disabled until every required field is valid
const isValid = computed(
  () =>
    passes(usernameRules, registerForm.value.username) &&
    passes(emailRules, registerForm.value.email) &&
    passes(passwordRules, registerForm.value.password) &&
    passes(confirmRules, registerForm.value.password_confirmation)
);

const isSubmitting = ref(false);
const formError = ref("");
// 422 errors from the API (e.g. "The username has already been taken."), shown on their field
const serverErrors = ref<Record<string, string>>({});

const submit = async () => {
  isSubmitting.value = true;
  formError.value = "";
  serverErrors.value = {};

  try {
    await auth.register(registerForm.value);
    onDialogOK();
  } catch (error) {
    const data = isAxiosError(error) ? error.response?.data : undefined;

    if (data?.errors) {
      // { username: ["taken"], email: [...] } -> { username: "taken", ... }
      for (const [field, messages] of Object.entries(data.errors)) {
        serverErrors.value[field] = (messages as string[])[0] ?? "";
      }
      if (serverErrors.value.avatar) avatarError.value = serverErrors.value.avatar;
    } else {
      formError.value = data?.message || "Something went wrong. Please try again.";
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.register {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.register__fields,
.register__actions {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.register__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.register__field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

// A <button> so it works with the keyboard; reset the browser's button look
.register__avatar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.register__avatar-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;

  &--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    background: $bg-card;
    color: $text-secondary;
  }
}

.register__avatar-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.register__avatar-title {
  color: $text-primary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.register__avatar-hint {
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}

.register__label {
  color: $text-primary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

// Label turns red when Quasar marks the input below as invalid
.register__field:has(.q-field--error) .register__label {
  color: $color-red;
}

// q-input's inner elements belong to Quasar, so they need :deep()
.register__input {
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

.register__icon--error {
  color: $color-red;
}

.register__icon--valid {
  color: $color-green;
}

.register__error {
  margin: 0;
  color: $color-red;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.register__alert {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0 0 -8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: $tint-red;
  color: $color-red;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.register__submit {
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

.register__switch {
  display: flex;
  gap: 5px;
  align-items: baseline;
  justify-content: center;
  margin: 0;
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.3;
}

.register__link {
  padding: 0;
  border: 0;
  background: none;
  color: $color-red;
  font: inherit;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
}
</style>
