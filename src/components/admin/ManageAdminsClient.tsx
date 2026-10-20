"use client";

import { useAction, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Search, ShieldCheck, UserMinus, UserPlus } from "lucide-react";
import { QueryErrorBanner } from "@/components/admin/shared/EditorStatus";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Button } from "@/components/ui/Button";
import { AdminRoleBadge } from "@/components/admin/AdminRoleBadge";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { analyzePassword } from "@/lib/passwordStrength";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { cn } from "@/lib/cn";
import { AdminField, RequiredFieldsNote, useRequiredFields } from "@/components/admin/shared/AdminField";

type UserRow = {
  _id: Id<"users">;
  name: string;
  email: string;
  role: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400";

export function ManageAdminsClient() {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  // Admins come from the role index; customers are found by search, so this
  // screen never has to load the whole users table.
  const admins = useSafeQuery(api.admin.getAdmins, canQuery ? { sessionToken } : "skip");
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue(term.trim(), 300);
  const searching = debouncedTerm.length > 0;
  const found = useSafeQuery(
    api.admin.searchUsers,
    canQuery && searching ? { sessionToken, term: debouncedTerm } : "skip",
  );
  const promote = useMutation(api.admin.promoteUser);
  const demote = useMutation(api.admin.demoteAdmin);
  const createAdmin = useAction(api.authActions.createAdminUser);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const pwOk = analyzePassword(password).meetsMinimum;

  // createAdminUser needs name, email and password (non-optional strings).
  const req = useRequiredFields(
    [
      { name: "name", label: "Name", value: name },
      { name: "email", label: "Email", value: email },
      {
        name: "password",
        label: "Password",
        value: password,
        isMissing: () => !pwOk,
        message: password ? "Password must meet all strength requirements." : "Password is required",
      },
    ],
    { idPrefix: "new-admin" },
  );

  /** Role changes report failures instead of dropping them on the floor. */
  async function changeRole(kind: "promote" | "demote", userId: Id<"users">, name: string) {
    const question =
      kind === "promote"
        ? `Give ${name} full admin access?`
        : `Remove admin access from ${name}?`;
    if (!window.confirm(question)) return;
    setMsg(null);
    if (typeof sessionToken !== "string") {
      setMsg("You have been signed out. Refresh the page and sign in again.");
      return;
    }
    try {
      if (kind === "promote") await promote({ sessionToken, userId });
      else await demote({ sessionToken, userId });
    } catch (er) {
      setMsg(toUserFacingErrorMessage(er));
    }
  }

  async function onCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (typeof sessionToken !== "string") {
      setMsg("You have been signed out. Refresh the page and sign in again.");
      return;
    }
    if (!pwOk) {
      setMsg("Password must meet all strength requirements.");
      return;
    }
    try {
      await createAdmin({ sessionToken, name, email, password });
      setName("");
      setEmail("");
      setPassword("");
      // Fields were cleared on purpose — don't flag them as missing.
      req.reset();
      setMsg("Admin created.");
    } catch (er) {
      setMsg(toUserFacingErrorMessage(er));
    }
  }

  if (admins.data === undefined && !admins.error) {
    return <p className="text-sm text-brand-muted">Loading…</p>;
  }

  const list = ((searching ? found.data : admins.data) ?? []) as UserRow[];

  return (
    <div className="space-y-10">
      <form
        noValidate
        onSubmit={(e) => {
          if (!req.guardSubmit(e)) return;
          void onCreateAdmin(e);
        }}
        className="max-w-md space-y-3 rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-primary" aria-hidden />
          <p className="text-sm font-bold text-brand-ink">Create admin account</p>
        </div>
        <p className="text-xs text-slate-500">
          Creates a new login that can use this admin area. To give admin access to someone who
          already has an account, find them below instead.
        </p>
        <RequiredFieldsNote />
        <AdminField
          label="Name"
          htmlFor={req.id("name")}
          required
          tip="The admin's full name, shown in the admin panel."
          error={req.errorFor("name")}
        >
          <input
            {...req.fieldProps("name")}
            placeholder="e.g. Ayesha Khan"
            className={cn(inputClass, "mt-1")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </AdminField>
        <AdminField
          label="Email"
          htmlFor={req.id("email")}
          required
          tip="Used to sign in. Must not already belong to another account."
          error={req.errorFor("email")}
        >
          <input
            {...req.fieldProps("email")}
            type="email"
            autoComplete="off"
            placeholder="e.g. ayesha@junkettours.com"
            className={cn(inputClass, "mt-1")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </AdminField>
        <AdminField
          label="Password"
          htmlFor={req.id("password")}
          required
          tip="The new admin's sign-in password. Share it with them privately."
          hint="Must pass every rule in the strength check below."
          error={req.errorFor("password")}
        >
          <input
            {...req.fieldProps("password")}
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="Min 8 characters"
            className={cn(inputClass, "mt-1")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </AdminField>
        <PasswordStrengthMeter password={password} />
        <Button type="submit" {...req.submitProps} disabled={typeof sessionToken !== "string"}>
          Create admin
        </Button>
        {msg ? <p className="text-sm text-slate-600">{msg}</p> : null}
      </form>

      <div>
        <p className="text-sm font-bold text-brand-ink">Who can use the admin area</p>
        <p className="mt-1 text-xs text-slate-500">
          Give a customer admin access, or take it away from an admin. The main owner accounts
          (super admins) can’t be changed here.
        </p>
        <div className="mt-4 space-y-3">
          <QueryErrorBanner error={admins.error ?? found.error} />
          <label className="relative block w-full sm:w-80">
            <span className="sr-only">Find a user to promote</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Find a customer by name or exact email"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400"
            />
          </label>
          <p className="text-xs text-slate-500">
            {searching
              ? found.isLoading
                ? "Searching…"
                : `${list.length} match${list.length === 1 ? "" : "es"} for “${debouncedTerm}”`
              : "Showing current admins. Search to find a customer to promote."}
          </p>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm">
          <table className="admin-stack-table min-w-[640px] w-full text-left text-sm">
            <thead className="whitespace-nowrap border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr
                  key={u._id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-brand-ink">
                    {u.name}
                  </td>
                  <td data-label="Email" className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td data-label="Role" className="px-4 py-3">
                    <AdminRoleBadge role={u.role} />
                  </td>
                  <td data-stack="actions" className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {u.role === "customer" ? (
                        <button
                          type="button"
                          className="inline-flex min-h-9 items-center gap-1 whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                          onClick={() => void changeRole("promote", u._id, u.name)}
                        >
                          <UserPlus className="h-3.5 w-3.5" aria-hidden />
                          Make admin
                        </button>
                      ) : null}
                      {u.role === "admin" ? (
                        <button
                          type="button"
                          className="inline-flex min-h-9 items-center gap-1 whitespace-nowrap rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                          onClick={() => void changeRole("demote", u._id, u.name)}
                        >
                          <UserMinus className="h-3.5 w-3.5" aria-hidden />
                          Remove admin access
                        </button>
                      ) : null}
                      {u.role === "super_admin" ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
