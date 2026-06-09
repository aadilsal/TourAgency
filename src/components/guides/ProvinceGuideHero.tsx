import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";

type Props = {
  name: string;
  tagline: string;
  intro: string;
  heroUrl: string;
  bestTime: string;
};

export function ProvinceGuideHero({
  name,
  tagline,
  intro,
  heroUrl,
  bestTime,
}: Props) {
  return (
    <div className="relative min-h-[min(55vh,520px)] w-full overflow-hidden">
      <Image src={heroUrl} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
      <PageContainer className="relative flex min-h-[min(55vh,520px)] flex-col justify-end pb-12 pt-32 text-white md:pb-16 md:pt-40">
        <p className="text-sm font-medium text-white/85">
          <Link href="/guides" className="hover:underline">
            Province guides
          </Link>{" "}
          / {name}
        </p>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/75">
          {tagline}
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {name}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/90">{intro}</p>
        <p className="mt-4 text-sm text-white/80">
          <span className="font-semibold text-white">Best time:</span> {bestTime}
        </p>
      </PageContainer>
    </div>
  );
}
