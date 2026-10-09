import { defineBoot } from "#q-app";
import useAuthStore from "@/stores/usaAuthStore";

export default defineBoot(({ router }) => {
  router.beforeEach(async to => {
    if (!to.meta.is_auth) {
      return true;
    }

    const { resolveMe } = useAuthStore();

    try {
      await resolveMe();
      return true;
    } catch {
      return { name: "home-page" };
    }
    
  });
});
