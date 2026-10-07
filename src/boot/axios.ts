import { defineBoot } from "#q-app";
import axios, { type AxiosInstance } from 'axios';

import useAuthStore from '@/stores/usaAuthStore';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

const api = axios.create({
  baseURL: 'https://api.kinoxii.redberryinternship.ge/api',
  headers: { Accept: 'application/json',},
});

export default defineBoot(async ({ app, store }) => {
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

  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;

  // Restore the session from a stored token; a stale one is dropped by the 401 handler above
  if (auth.token) {
    await auth.fetchMe().catch(() => undefined);
  }
});

export { api };
