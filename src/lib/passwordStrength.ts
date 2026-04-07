export type PasswordCheck = { id: string; ok: boolean; label: string };

export type PasswordAnalysis = {
  score: number;
  maxScore: number;
  label: string;
  checks: PasswordCheck[];
  meetsMinimum: boolean;
};

const MAX = 4;

export function analyzePassword(password: string): PasswordAnalysis {
  const checks: PasswordCheck[] = [
    { id: "len", ok: password.length >= 8, label: "At least 8 characters" },
    {
      id: "case",
      ok: /[A-Z]/.test(password) && /[a-z]/.test(password),
      label: "Upper and lowercase letters",
    },
    { id: "num", ok: /[0-9]/.test(password), label: "At least one number" },
    {
      id: "sym",
      ok: /[^A-Za-z0-9]/.test(password),
      label: "At least one symbol",
    },
  ];

  let score = 0;
  for (const c of checks) {
    if (c.ok) score++;
  }

  const label =
    score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";

  return {
    score,
    maxScore: MAX,
    label,
    checks,
    meetsMinimum: score >= MAX,
  };
}
