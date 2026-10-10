import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";

import { api } from "@/boot/axios";
import type {User} from "@/api/resources/User";

const TOKEN_KEY = "auth_token";

interface AuthResponse {
  data: { user: User; token: string };
}

type Credentials = { email: string; password: string};

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  avatar?: File | null;
}

const useAuthStore = defineStore("auth", () => {

  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const user = ref<User | null>(null);

  const isAuthenticated = computed(() => token.value !== null);



  const setToken = (value: string | null) => {
    token.value = value;
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  };

  const login = async ({email, password}: Credentials) => {
    const { data } = await api.post<AuthResponse>("/login", {email, password});
    setToken(data.data.token);
    user.value = data.data.user;
    return data.data.user;
  };

  const clear = () => {
    setToken(null);
    user.value = null;
  };

  const register = async (payload: RegisterPayload) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value);
    });

    const { data } = await api.post<AuthResponse>("/register", form);
    setToken(data.data.token);
    user.value = data.data.user;
    return data.data.user;
  };

  const fetchMe = async () => {
    const { data } = await api.get<{ data: User }>("/me");
    user.value = data.data;
    return data.data;
  };

  const resolveMe= async (): Promise<User> => {
    return !user.value ? await fetchMe() : user.value;
  }

  const logout = async () => {
    try {
      await api.post("/logout");
    } finally {
      // The API says to drop the token regardless of the response
      clear();
    }
  };

  return {
    token,
    user,
    isAuthenticated,
    clear,
    login,
    register,
    fetchMe,
    resolveMe,
    logout
  };
});
export default useAuthStore

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
