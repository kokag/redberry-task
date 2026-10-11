import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

import { useAuthDialog } from "@/components/auth/useAuthDialog";
import BookingModal from "@/components/booking/BookingModal.vue";
import useAuthStore from "@/stores/useAuthStore";

export const useBookingDialog = () => {
  const { dialog } = useQuasar();
  const router = useRouter();
  const auth = useAuthStore();
  const { openLoginDialog } = useAuthDialog();

  // Booking needs a login and a complete profile (spec 5)
  const openBooking = (sessionId: number) => {
    if (!auth.isAuthenticated) {
      // After logging in the same click carries on by itself (spec 1.1)
      openLoginDialog().onOk(() => openBooking(sessionId));
      return;
    }

    if (!auth.user?.profileComplete) {
      dialog({
        title: "Complete your profile",
        message: "Please complete your profile to enable booking.",
        ok: { label: "Go to profile", color: "primary", noCaps: true, unelevated: true, rounded: true },
        cancel: { label: "Later", flat: true, noCaps: true, color: "white" },
        dark: true
      }).onOk(() => void router.push({ name: "profile" }));
      return;
    }

    dialog({ component: BookingModal, componentProps: { sessionId } });
  };

  return { openBooking };
};
