import { api } from "@/boot/axios";
import type { MovieSessions, SessionsMeta } from "@/api/resources/Session";

// Array filters take slugs; axios sends them as venues[]=a&venues[]=b, which is what the API expects
export interface SessionsParams {
  date?: string | undefined;
  venues: string[];
  formats: string[];
  languages: string[];
  bands: string[];
  sort?: string | undefined;
  page: number;
}

export const fetchSessions = async (params: SessionsParams) => {
  const { data } = await api.get<{ data: MovieSessions[]; meta: SessionsMeta }>(
    "/sessions",
    {
      params
    }
  );
  return data;
};
