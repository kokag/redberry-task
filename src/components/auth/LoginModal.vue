<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <AppModal title="Log in" subtitle="Welcome back to Kino XII">
      <form class="login" novalidate @submit.prevent="submit">
        <div class="login__fields">
          <div class="login__field">
            <label for="login-email" class="login__label">Email</label>
            <q-input
              ref="emailInput"
              v-model="loginForm.email"
              for="login-email"
              type="email"
              placeholder="example@gmail.com"
              :rules="emailRules"
              lazy-rules
              dense
              borderless
              no-error-icon
              hide-bottom-space
              class="login__input"
            >
              <template #append>
                <AppIcon
                  v-if="emailInput?.hasError"
                  name="alert-circle"
                  class="login__icon--error"
                />
                <AppIcon
                  v-else-if="passes(emailRules, loginForm.email)"
                  name="check"
                  class="login__icon--valid"
                />
              </template>
            </q-input>
          </div>

          <div class="login__field">
            <label for="login-password" class="login__label">Password</label>
            <q-input
              ref="passwordInput"
              v-model="loginForm.password"
              for="login-password"
              type="password"
              placeholder="••••••••"
              :rules="passwordRules"
              lazy-rules
              dense
              borderless
              no-error-icon
              hide-bottom-space
              class="login__input"
            >
              <template #append>
                <AppIcon
                  v-if="passwordInput?.hasError"
                  name="alert-circle"
                  class="login__icon--error"
                />
                <AppIcon
                  v-else-if="passes(passwordRules, loginForm.password)"
                  name="check"
                  class="login__icon--valid"
                />
              </template>
            </q-input>
          </div>
        </div>

        <div class="login__actions">
          <p v-if="formError" class="login__alert" role="alert">
            <AppIcon name="alert-circle" />
            {{ formError }}
          </p>

          <q-btn
            type="submit"
            unelevated
            rounded
            no-caps
            label="Log in"
            class="login__submit"
            :loading="isSubmitting"
            :disable="!isValid"
          />

          <p class="login__switch">
            Don't have an account?
            <button type="button" class="login__link" @click="goToRegister">Sign up</button>
          </p>
        </div>
      </form>
    </AppModal>
  </q-dialog>
</template>

<script setup lang="ts">
import { isAxiosError } from "axios";
import { useDialogPluginComponent, type QInput } from "quasar";
import { computed, ref } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import AppModal from "@/components/ui/AppModal.vue";
import useAuthStore from "@/stores/useAuthStore";
import { emailRules, passes, passwordRules } from "@/utils/validation";
import { useAuthDialog } from "@/components/auth/useAuthDialog";

type loginCredentials = { email: string; password: string };

// Required by $q.dialog({ component }): dialogRef goes on the q-dialog, onDialogOK closes it
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
const { openRegisterDialog } = useAuthDialog();

// "Sign up" link: close this dialog and open the registration one
const goToRegister = () => {
  onDialogCancel();
  openRegisterDialog();
};

const auth = useAuthStore();
const loginForm = ref<loginCredentials>({ email: "", password: "" });
const isSubmitting = ref(false);

// Template refs, so the icons can read Quasar's `hasError`
const emailInput = ref<QInput | null>(null);
const passwordInput = ref<QInput | null>(null);

// The Log in button stays disabled until both fields are valid
const isValid = computed(
  () =>
    passes(emailRules, loginForm.value.email) &&
    passes(passwordRules, loginForm.value.password)
);

const formError = ref("");

const submit = async () => {
  isSubmitting.value = true;
  formError.value = "";

  try {
    await auth.login(loginForm.value);
    onDialogOK();
  } catch (error) {
    // e.g. 401 "Invalid credentials." The email stays filled in because we don't reset the form
    formError.value =
      (isAxiosError(error) && error.response?.data?.message) ||
      "Something went wrong. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.login {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.login__fields,
.login__actions {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.login__field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login__label {
  color: $text-primary;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

// Label turns red when Quasar marks the input below as invalid
.login__field:has(.q-field--error) .login__label {
  color: $color-red;
}

// q-input's inner elements belong to Quasar, so they need :deep()
.login__input {
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

.login__icon--error {
  color: $color-red;
}

.login__icon--valid {
  color: $color-green;
}

.login__alert {
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

.login__submit {
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

.login__switch {
  display: flex;
  gap: 5px;
  align-items: baseline;
  justify-content: center;
  margin: 0;
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.3;
}

.login__link {
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
