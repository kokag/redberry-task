import { defineStore, acceptHMRUpdate } from "pinia";
import { ref } from "vue";

import { api } from "@/boot/axios";
import type { FilterOptions } from "@/api/resources/FilterOptions";

// Venues, formats, sorts, ticket types etc. come from the API, never hardcoded
const useFilterOptionsStore = defineStore("filterOptions", () => {
  const options = ref<FilterOptions | null>(null);

  const load = async () => {
    const { data } = await api.get<{ data: FilterOptions }>("/filter-options");
    options.value = data.data;
  };

  return { options, load };
});
export default useFilterOptionsStore;

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFilterOptionsStore, import.meta.hot));
}
