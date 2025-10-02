import { cn } from "@/lib/utils";

export function SectionTitleContainer({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {children}
    </div>
  );
}

export function SectionHeading({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-sm font-medium uppercase tracking-wider text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function SectionTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-3xl font-bold tracking-tight", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function LightTitleSpan({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("font-light", className)} {...props}>
      {children}
    </span>
  );
}
