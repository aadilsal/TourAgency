"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FieldError,
  FieldLabel,
  SelectField,
  TextInput,
} from "@/components/ui/FormField";
import { CountrySelect } from "@/components/visa/CountrySelect";
import type { VisaTravelerForm } from "@/lib/visa/validation";
type Props = {
  index: number;
  traveler: VisaTravelerForm;
  errors: Record<string, string>;
  onChange: (patch: Partial<VisaTravelerForm>) => void;
  onRemove: () => void;
  canRemove: boolean;
};

function err(errors: Record<string, string>, index: number, field: string) {
  return errors[`travelers.${index}.${field}`];
}

export function TravelerCard({
  index,
  traveler,
  errors,
  onChange,
  onRemove,
  canRemove,
}: Props) {
  const prefix = `traveler-${traveler.clientId}`;

  return (
    <div
      className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5"
      data-traveler-index={index}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900">
          Traveler {index + 1}
        </h3>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-9 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onRemove}
            aria-label={`Remove traveler ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel htmlFor={`${prefix}-name`} required>
            Full name (as on passport)
          </FieldLabel>
          <TextInput
            id={`${prefix}-name`}
            value={traveler.name}
            onChange={(e) => onChange({ name: e.target.value })}
            error={!!err(errors, index, "name")}
            autoComplete="name"
            placeholder="e.g. John Smith"
          />
          <FieldError>{err(errors, index, "name")}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor={`${prefix}-sex`} required>
            Sex
          </FieldLabel>
          <SelectField
            id={`${prefix}-sex`}
            value={traveler.sex}
            onChange={(e) =>
              onChange({ sex: e.target.value as VisaTravelerForm["sex"] })
            }
            error={!!err(errors, index, "sex")}
          >
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </SelectField>
          <FieldError>{err(errors, index, "sex")}</FieldError>
        </div>

        <div>
          <CountrySelect
            id={`${prefix}-nationality`}
            value={traveler.nationalityCode}
            onChange={(code) => onChange({ nationalityCode: code })}
            error={err(errors, index, "nationalityCode")}
            required
          />
        </div>

        <div>
          <FieldLabel htmlFor={`${prefix}-dob`} required>
            Date of birth
          </FieldLabel>
          <TextInput
            id={`${prefix}-dob`}
            type="date"
            value={traveler.dateOfBirth}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            error={!!err(errors, index, "dateOfBirth")}
          />
          <FieldError>{err(errors, index, "dateOfBirth")}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor={`${prefix}-passport`} required>
            Passport number
          </FieldLabel>
          <TextInput
            id={`${prefix}-passport`}
            value={traveler.passportNumber}
            onChange={(e) => onChange({ passportNumber: e.target.value })}
            error={!!err(errors, index, "passportNumber")}
            autoComplete="off"
            placeholder="e.g. AB1234567"
          />
          <FieldError>{err(errors, index, "passportNumber")}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor={`${prefix}-issue`} required>
            Date of issue
          </FieldLabel>
          <TextInput
            id={`${prefix}-issue`}
            type="date"
            value={traveler.passportIssueDate}
            onChange={(e) => onChange({ passportIssueDate: e.target.value })}
            error={!!err(errors, index, "passportIssueDate")}
          />
          <FieldError>{err(errors, index, "passportIssueDate")}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor={`${prefix}-expiry`} required>
            Date of expiry
          </FieldLabel>
          <TextInput
            id={`${prefix}-expiry`}
            type="date"
            value={traveler.passportExpiryDate}
            onChange={(e) => onChange({ passportExpiryDate: e.target.value })}
            error={!!err(errors, index, "passportExpiryDate")}
          />
          <FieldError>{err(errors, index, "passportExpiryDate")}</FieldError>
        </div>
      </div>
    </div>
  );
}
