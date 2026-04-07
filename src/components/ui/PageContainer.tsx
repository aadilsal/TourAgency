import { cn } from "@/lib/cn";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-content px-6 md:px-12 lg:px-20",
        className,
      )}
    >
      {children}
    </div>
  );
}
