export interface AgeRating {
  code: string;
  minAge: number;
  description: string;
}

export interface Genre {
  id: number;
  slug: string;
  name: string;
}

export interface Format {
  id: number;
  slug: string;
  name: string;
  priceUplift: number;
}

export interface Movie {
  id: number;
  slug: string;
  title: string;
  kind: "film" | "event";
  runtimeMinutes: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  isComingSoon: boolean;
  isNotified: boolean;
  isFeatured: boolean;
  fromPrice: number;
  ageRating: AgeRating;
  genres: Genre[];
  formats: Format[];
}

export interface MovieWithSynopsis extends Movie {
  synopsis: string;
}

// GET /movies/{slug}
export interface MovieDetail extends MovieWithSynopsis {
  director: string | null;
  cast: string | null;
  // Only the dates that have sessions
  availableDates: string[];
}
