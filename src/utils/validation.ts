// A q-input rule: return true when the value is fine, or the error message to show
export type Rule = (val: string) => true | string;

export const emailRules: Rule[] = [
  val => !!val || "Email is required",
  val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || "Enter a valid email address"
];

export const passwordRules: Rule[] = [
  val => !!val || "Password is required",
  val => val.length >= 3 || "At least 3 characters"
];

// True when the value passes every rule (shows the green check)
export const passes = (rules: Rule[], val: string) => rules.every(rule => rule(val) === true);
