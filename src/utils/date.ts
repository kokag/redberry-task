import { date } from "quasar";

// "2026-11-14" in the user's local time; the format the API and our URL use.
// en-CA happens to format dates as YYYY-MM-DD; toISOString() would use UTC and can be a day off
export const toDateString = (date: Date) => date.toLocaleDateString("en-CA");

export const today = () => toDateString(new Date());

// The API's "2026-10-09" as e.g. "Fri 9 Oct". extractDate reads it as a local date, so it can't shift a day
export const formatDay = (value: string, pattern = "ddd D MMM") =>
  date.formatDate(date.extractDate(value, "YYYY-MM-DD"), pattern);
