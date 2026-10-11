import type { User } from "@/api/resources/User";

// fullName is only set once the profile is filled in, so fall back to the username
export const getFullName = (user: User) =>
  user.fullName?.trim() || user.username;

export const getFirstName = (user: User) =>
  getFullName(user).split(/\s+/)[0] ?? "";

export const getInitials = (user: User) => {
  const [first = "", second] = getFullName(user).split(/\s+/);
  const initials = second
    ? first.charAt(0) + second.charAt(0)
    : first.slice(0, 2);

  return initials.toUpperCase();
};
