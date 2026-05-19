import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx("inline-flex items-center justify-center gap-2 border border-ink/20 bg-ink px-3 py-2 text-sm font-medium text-white transition hover:bg-blue disabled:cursor-not-allowed disabled:opacity-50", className)}
      {...props}
    />
  );
}
