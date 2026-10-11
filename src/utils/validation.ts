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

export const fullNameRules: Rule[] = [
  val => !!val.trim() || "Name is required",
  val => val.trim().length >= 3 || "Name must be at least 3 characters",
  val => val.trim().length <= 50 || "Name must not exceed 50 characters"
];

// Both "599 123 456" and "599123456" are allowed, so the spaces are ignored
const withoutSpaces = (val: string) => val.replace(/\s/g, "");

export const mobileNumberRules: Rule[] = [
  val => !!withoutSpaces(val) || "Mobile number is required",
  val =>
    /^\d+$/.test(withoutSpaces(val)) ||
    "Please enter a valid Georgian mobile number (9 digits starting with 5)",
  val => withoutSpaces(val).startsWith("5") || "Georgian mobile numbers must start with 5",
  val => withoutSpaces(val).length === 9 || "Mobile number must be exactly 9 digits"
];

// The date `years` years before today
const yearsAgo = (years: number) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
};

// val is the date input's value, "YYYY-MM-DD"
export const dateOfBirthRules: Rule[] = [
  val => !!val || "Date of birth is required",
  val => new Date(val) <= new Date() || "Please enter a valid date of birth",
  val => new Date(val) <= yearsAgo(12) || "You must be at least 12 years old to create an account"
];

// Checkout card fields. Spaces are allowed in the card number ("4242 4242 4242 4242")
export const cardNumberRules: Rule[] = [
  val => !!withoutSpaces(val) || "Card number is required",
  val => /^\d{16}$/.test(withoutSpaces(val)) || "Card number must be 16 digits"
];

// "MM/YY"; a card is valid until the end of its expiry month
export const expiryRules: Rule[] = [
  val => !!val || "Expiry is required",
  val => /^(0[1-9]|1[0-2])\/\d{2}$/.test(val) || "Use the MM/YY format",
  val => {
    const [month, year] = val.split("/").map(Number);
    return new Date(2000 + year!, month!) > new Date() || "This card has expired";
  }
];

export const cvvRules: Rule[] = [
  val => !!val || "CVV is required",
  val => /^\d{3}$/.test(val) || "CVV must be 3 digits"
];

// True when the value passes every rule (shows the green check)
export const passes = (rules: Rule[], val: string) => rules.every(rule => rule(val) === true);

// A 422's `errors` from the API, one message per field for the inputs:
// { email: ["The email has already been taken."] } -> { email: "The email has already been taken." }
export const toFieldErrors = (errors: Record<string, string[]>) =>
  Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0] ?? ""]));
