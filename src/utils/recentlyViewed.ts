import type { Movie } from "@/api/resources/Movie";

const STORAGE_KEY = "recently_viewed";
const MAX_ITEMS = 10;

// Only what the home page card shows, so it renders without asking the API again
export interface ViewedMovie {
  slug: string;
  title: string;
  posterUrl: string | null;
  genre: string | null;
  runtimeMinutes: number;
  ageRating: string;
}

export const getRecentlyViewed = (): ViewedMovie[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    // Broken JSON or storage blocked: just show nothing
    return [];
  }
};

// Newest first; viewing a film again moves it to the front instead of adding it twice
export const addRecentlyViewed = (movie: Movie) => {
  const viewed: ViewedMovie = {
    slug: movie.slug,
    title: movie.title,
    posterUrl: movie.posterUrl,
    genre: movie.genres[0]?.name ?? null,
    runtimeMinutes: movie.runtimeMinutes,
    ageRating: movie.ageRating.code
  };
  const others = getRecentlyViewed().filter(item => item.slug !== movie.slug);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([viewed, ...others].slice(0, MAX_ITEMS)));
  } catch {
    // Storage full or blocked: the list is a nice-to-have, so ignore it
  }
};
