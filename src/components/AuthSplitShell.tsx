import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export function AuthSplitShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-primary via-brand-primary-dark to-slate-900 p-10 text-white lg:flex xl:p-14">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=70')] bg-cover bg-center opacity-25 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-brand-primary/80 to-brand-primary/40" />
        <div className="relative z-[1]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <p className="mt-12 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-accent">
            <Sparkles className="h-4 w-4" />
            JunketTours
          </p>
          <h1 className="mt-4 max-w-md font-display text-3xl font-semibold leading-tight xl:text-4xl">
            Northern Pakistan, planned with clarity.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            AI itineraries, verified tours, and a team on WhatsApp when you
            need a human.
          </p>
        </div>
        <p className="relative z-[1] text-xs text-white/50">
          © {new Date().getFullYear()} JunketTours
        </p>
      </div>

      <div className="flex min-h-screen flex-col justify-center px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-brand-accent lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <h1 className="font-display text-2xl font-semibold text-white">
            {title}
          </h1>
          {subtitle ? (
            <div className="mt-2 text-sm text-slate-400">{subtitle}</div>
          ) : null}
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/95 p-6 shadow-glass backdrop-blur-glass md:p-8">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
