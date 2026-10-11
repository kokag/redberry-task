import type { Format, Movie } from "@/api/resources/Movie";
import type { Language, Venue } from "@/api/resources/FilterOptions";

export interface Session {
  id: number;
  startsAt: string;
  date: string;
  time: string;
  timeBand: "morning" | "afternoon" | "evening";
  price: number;
  seatsLeft: number;
  isSoldOut: boolean;
  // The API sends the venue here without its formats list
  hall: { id: number; name: string; venue: Omit<Venue, "formats"> };
  venue: Omit<Venue, "formats">;
  format: Format;
  language: Language;
  // Sent by GET /sessions/{id} and inside orders, not in lists grouped by film
  movie?: Movie;
}

export interface MovieSessions {
  movie: Movie;
  sessions: Session[];
}

// GET /movies/{slug}/sessions groups by venue instead of by film
export interface VenueSessions {
  venue: Omit<Venue, "formats">;
  sessions: Session[];
}

export interface SessionsMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  totalSessions: number;
  totalMovies: number;
  date: string;
}
