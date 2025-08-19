import { cn } from "../../lib/cn";

const base =
  "rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-sm";

export default function Card({ className, ...props }) {
  return <div className={cn(base, className)} {...props} />;
}
