import { useQuasar } from "quasar";

import LoginModal from "@/components/auth/LoginModal.vue";
import RegisterModal from "@/components/auth/RegisterModal.vue";

export const useAuthDialog = () => {
  const { dialog } = useQuasar();

  const openLoginDialog = () => dialog({ component: LoginModal });
  const openRegisterDialog = () => dialog({ component: RegisterModal });

  return { openLoginDialog, openRegisterDialog };
};
