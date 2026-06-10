import { z } from "zod";
import { getCountryByCode, isValidCountryCode } from "@/lib/countries";

export type VisaSex = "male" | "female" | "other";

export type VisaTravelerForm = {
  clientId: string;
  name: string;
  sex: VisaSex | "";
  nationalityCode: string;
  dateOfBirth: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
};

export type VisaSubmissionForm = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  travelers: VisaTravelerForm[];
  consentGiven: boolean;
};

const NAME_RE = /^[\p{L}\s'.-]+$/u;

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

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(100, "Name must be at most 100 characters.")
  .regex(NAME_RE, "Name contains invalid characters.");

export const visaTravelerSchema = z
  .object({
    name: nameSchema,
    sex: z.enum(["male", "female", "other"], {
      message: "Select sex.",
    }),
    nationalityCode: z
      .string()
      .min(1, "Select nationality.")
      .refine((c) => isValidCountryCode(c), "Select a valid nationality."),
    dateOfBirth: z.string().min(1, "Date of birth is required."),
    passportNumber: z
      .string()
      .trim()
      .transform((s) => s.toUpperCase())
      .pipe(
        z
          .string()
          .regex(/^[A-Z0-9]{6,12}$/, "Passport must be 6–12 letters or numbers."),
      ),
    passportIssueDate: z.string().min(1, "Issue date is required."),
    passportExpiryDate: z.string().min(1, "Expiry date is required."),
  })
  .superRefine((data, ctx) => {
    const today = todayUtc();
    const dob = parseIsoDate(data.dateOfBirth);
    if (!dob) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid date of birth.",
        path: ["dateOfBirth"],
      });
    } else {
      if (dob > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of birth cannot be in the future.",
          path: ["dateOfBirth"],
        });
      }
      const age = ageInYears(dob, today);
      if (age < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Traveler must be at least 1 year old.",
          path: ["dateOfBirth"],
        });
      }
      if (age > 120) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of birth is not valid.",
          path: ["dateOfBirth"],
        });
      }
    }

    const issue = parseIsoDate(data.passportIssueDate);
    if (!issue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid issue date.",
        path: ["passportIssueDate"],
      });
    } else if (issue > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Issue date cannot be in the future.",
        path: ["passportIssueDate"],
      });
    } else if (dob) {
      const minIssue = new Date(dob.getTime() + 24 * 60 * 60 * 1000);
      if (issue < minIssue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Issue date must be after date of birth.",
          path: ["passportIssueDate"],
        });
      }
    }

    const expiry = parseIsoDate(data.passportExpiryDate);
    if (!expiry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid expiry date.",
        path: ["passportExpiryDate"],
      });
    } else {
      if (expiry <= today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passport must not be expired.",
          path: ["passportExpiryDate"],
        });
      }
      if (issue && expiry <= issue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expiry must be after issue date.",
          path: ["passportExpiryDate"],
        });
      }
    }
  });

export const visaSubmissionSchema = z.object({
  contactName: nameSchema,
  contactEmail: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .max(254)
    .email("Enter a valid email address."),
  contactPhone: z
    .string()
    .trim()
    .min(1, "Phone is required.")
    .refine((p) => p.replace(/\D/g, "").length >= 7, {
      message: "Enter a valid phone number (at least 7 digits).",
    }),
  travelers: z
    .array(visaTravelerSchema)
    .min(1, "Add at least one traveler.")
    .max(10, "Maximum 10 travelers per request."),
  consentGiven: z.literal(true, {
    message: "You must consent to processing your passport details.",
  }),
});

export type VisaSubmissionPayload = z.infer<typeof visaSubmissionSchema>;

export type FieldErrors = Record<string, string>;

export function parseVisaSubmission(data: {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  travelers: Omit<VisaTravelerForm, "clientId">[];
  consentGiven: boolean;
}):
  | { success: true; data: VisaSubmissionPayload & { travelersWithLabels: Array<VisaSubmissionPayload["travelers"][0] & { nationalityLabel: string }> } }
  | { success: false; fieldErrors: FieldErrors; formError?: string } {
  const result = visaSubmissionSchema.safeParse(data);
  if (!result.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { success: false, fieldErrors };
  }

  const travelersWithLabels = result.data.travelers.map((t) => ({
    ...t,
    nationalityLabel: getCountryByCode(t.nationalityCode)?.name ?? t.nationalityCode,
  }));

  return { success: true, data: { ...result.data, travelersWithLabels } };
}

export function passportExpiryWarning(expiryDate: string): boolean {
  const expiry = parseIsoDate(expiryDate);
  if (!expiry) return false;
  const today = todayUtc();
  const sixMonths = new Date(today);
  sixMonths.setUTCMonth(sixMonths.getUTCMonth() + 6);
  return expiry < sixMonths;
}

export function createEmptyTraveler(): VisaTravelerForm {
  return {
    clientId: crypto.randomUUID(),
    name: "",
    sex: "",
    nationalityCode: "",
    dateOfBirth: "",
    passportNumber: "",
    passportIssueDate: "",
    passportExpiryDate: "",
  };
}
