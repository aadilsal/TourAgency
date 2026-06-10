import { isValidCountryCode } from "./countryCodes.js";

export type VisaSex = "male" | "female" | "other";

export type VisaTravelerInput = {
  name: string;
  sex: VisaSex;
  nationalityCode: string;
  nationalityLabel: string;
  dateOfBirth: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
};

export type VisaSubmissionInput = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  travelers: VisaTravelerInput[];
  consentGiven: boolean;
};

/** Letters (ASCII + Latin extended), spaces, apostrophe, period, hyphen — no /u flag for TS compat. */
const NAME_RE = /^[A-Za-z\u00C0-\u024F\s'.-]+$/;

function parseIsoDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function ageInYears(dob: Date, ref: Date): number {
  let age = ref.getUTCFullYear() - dob.getUTCFullYear();
  const m = ref.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

function validateName(name: string, field: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return `${field} is required.`;
  if (trimmed.length < 2 || trimmed.length > 100) {
    return `${field} must be 2–100 characters.`;
  }
  if (!NAME_RE.test(trimmed)) {
    return `${field} contains invalid characters.`;
  }
  return null;
}

function validateTraveler(t: VisaTravelerInput, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Traveler ${index + 1}`;

  const nameErr = validateName(t.name, `${prefix} name`);
  if (nameErr) errors.push(nameErr);

  if (!["male", "female", "other"].includes(t.sex)) {
    errors.push(`${prefix}: sex is required.`);
  }

  if (!t.nationalityCode || !isValidCountryCode(t.nationalityCode)) {
    errors.push(`${prefix}: select a valid nationality.`);
  }

  const dob = parseIsoDate(t.dateOfBirth);
  const today = todayUtc();
  if (!dob) {
    errors.push(`${prefix}: enter a valid date of birth.`);
  } else {
    if (dob > today) errors.push(`${prefix}: date of birth cannot be in the future.`);
    const age = ageInYears(dob, today);
    if (age < 1) errors.push(`${prefix}: traveler must be at least 1 year old.`);
    if (age > 120) errors.push(`${prefix}: date of birth is not valid.`);
  }

  const passport = t.passportNumber.trim().toUpperCase();
  if (!passport) {
    errors.push(`${prefix}: passport number is required.`);
  } else if (!/^[A-Z0-9]{6,12}$/.test(passport)) {
    errors.push(`${prefix}: passport must be 6–12 letters or numbers.`);
  }

  const issue = parseIsoDate(t.passportIssueDate);
  if (!issue) {
    errors.push(`${prefix}: enter a valid passport issue date.`);
  } else if (issue > today) {
    errors.push(`${prefix}: issue date cannot be in the future.`);
  } else if (dob) {
    const minIssue = new Date(dob.getTime() + 24 * 60 * 60 * 1000);
    if (issue < minIssue) {
      errors.push(`${prefix}: issue date must be after date of birth.`);
    }
  }

  const expiry = parseIsoDate(t.passportExpiryDate);
  if (!expiry) {
    errors.push(`${prefix}: enter a valid passport expiry date.`);
  } else {
    if (expiry <= today) {
      errors.push(`${prefix}: passport must not be expired.`);
    }
    if (issue && expiry <= issue) {
      errors.push(`${prefix}: expiry date must be after issue date.`);
    }
  }

  return errors;
}

export function validateVisaSubmission(input: VisaSubmissionInput): {
  ok: true;
  normalized: VisaSubmissionInput & { contactPhoneNormalized: string };
} | { ok: false; message: string } {
  const errors: string[] = [];

  const contactNameErr = validateName(input.contactName, "Contact name");
  if (contactNameErr) errors.push(contactNameErr);

  const email = input.contactEmail.trim().toLowerCase();
  if (!email) {
    errors.push("Email is required.");
  } else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Enter a valid email address.");
  }

  const phoneNormalized = input.contactPhone.replace(/\D/g, "");
  if (!input.contactPhone.trim()) {
    errors.push("Phone is required.");
  } else if (phoneNormalized.length < 7) {
    errors.push("Enter a valid phone number (at least 7 digits).");
  }

  if (!input.consentGiven) {
    errors.push("You must consent to processing your passport details.");
  }

  if (!input.travelers?.length) {
    errors.push("Add at least one traveler.");
  } else if (input.travelers.length > 10) {
    errors.push("Maximum 10 travelers per request.");
  } else {
    for (let i = 0; i < input.travelers.length; i++) {
      errors.push(...validateTraveler(input.travelers[i], i));
    }
  }

  if (errors.length > 0) {
    return { ok: false, message: errors[0] };
  }

  const normalized: VisaSubmissionInput & { contactPhoneNormalized: string } = {
    contactName: input.contactName.trim(),
    contactEmail: email,
    contactPhone: input.contactPhone.trim(),
    contactPhoneNormalized: phoneNormalized,
    consentGiven: true,
    travelers: input.travelers.map((t) => ({
      name: t.name.trim(),
      sex: t.sex,
      nationalityCode: t.nationalityCode,
      nationalityLabel: t.nationalityLabel.trim(),
      dateOfBirth: t.dateOfBirth,
      passportNumber: t.passportNumber.trim().toUpperCase(),
      passportIssueDate: t.passportIssueDate,
      passportExpiryDate: t.passportExpiryDate,
    })),
  };

  return { ok: true, normalized };
}

/** Non-blocking warning: passport expires within 6 months. */
export function passportExpiryWarning(expiryDate: string): boolean {
  const expiry = parseIsoDate(expiryDate);
  if (!expiry) return false;
  const today = todayUtc();
  const sixMonths = new Date(today);
  sixMonths.setUTCMonth(sixMonths.getUTCMonth() + 6);
  return expiry < sixMonths;
}
