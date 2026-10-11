import type { AgeRating, Format } from "@/api/resources/Movie";

export interface Venue {
  id: number;
  slug: string;
  name: string;
  city: string;
  formats: Format[];
}

export interface Language {
  id: number;
  slug: string;
  name: string;
  code: string;
}

export interface Option {
  id: string;
  label: string;
}

export interface TicketType {
  id: number;
  slug: string;
  name: string;
  priceRatio: number;
  note: string | null;
  blockedFromRatingAge: number | null;
}

export interface FilterOptions {
  venues: Venue[];
  formats: Format[];
  languages: Language[];
  timeBands: Option[];
  sorts: Option[];
  ticketTypes: TicketType[];
  ageRatings: AgeRating[];
  maxSeatsPerOrder: number;
  holdMinutes: number;
}
