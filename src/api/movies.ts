import { api } from "@/boot/axios";
import type {
  Movie,
  MovieDetail,
  MovieWithSynopsis
} from "@/api/resources/Movie";
import type { VenueSessions } from "@/api/resources/Session";

export const fetchFeatured = async () => {
  const { data } = await api.get<{ data: MovieWithSynopsis[] }>("/movies/featured");
  return data.data;
};

export const fetchNowPlaying = async (limit: number) => {
  const { data } = await api.get<{ data: MovieWithSynopsis[] }>("/movies/now-playing", {
    params: { limit }
  });
  return data.data;
};

export const fetchComingSoon = async (limit: number) => {
  const { data } = await api.get<{ data: Movie[] }>("/movies/coming-soon", {
    params: { limit }
  });
  return data.data;
};

export const fetchMovie = async (slug: string) => {
  const { data } = await api.get<{ data: MovieDetail }>(`/movies/${slug}`);
  return data.data;
};

// Header typeahead: matches on title, max 6 results; a blank query returns []
export const searchMovies = async (q: string) => {
  const { data } = await api.get<{ data: Movie[] }>("/search", { params: { q } });
  return data.data;
};

export const fetchMovieSessions = async (slug: string, date: string) => {
  const { data } = await api.get<{ data: VenueSessions[] }>(
    `/movies/${slug}/sessions`,
    { params: { date } }
  );
  return data.data;
};

// Idempotent on the API side: calling it twice still returns 201
export const notifyMe = async (slug: string) => {
  const { data } = await api.post<{ data: { movieId: number; subscribed: boolean } }>(
    `/movies/${slug}/notify`
  );
  return data.data;
};
