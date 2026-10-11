import { defineBoot } from "#q-app";
import axios from 'axios';

import useAuthStore from '@/stores/useAuthStore';
import useFilterOptionsStore from '@/stores/useFilterOptionsStore';

const api = axios.create({
  baseURL: 'https://api.kinoxii.redberryinternship.ge/api',
  headers: { Accept: 'application/json',},
});

export default defineBoot(async ({ store }) => {
  const auth = useAuthStore(store);

  api.interceptors.request.use((config) => {
    if (auth.token) {
      config.headers.set('Authorization', `Bearer ${auth.token}`);
    }

    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // A 401 from /login means wrong credentials; anywhere else the token is missing, expired or revoked
      if (error.response?.status === 401 && error.config?.url !== '/login') {
        auth.clear();
      }

      return Promise.reject(error);
    },
  );

  // Both run in parallel before the app renders:
  // - filter options are fetched once and cached; a page that needs them calls load() again if this failed
  // - the session is restored from a stored token; a stale one is dropped by the 401 handler above
  await Promise.all([
    useFilterOptionsStore(store).load().catch(() => undefined),
    auth.token ? auth.fetchMe().catch(() => undefined) : undefined
  ]);
});

export { api };
