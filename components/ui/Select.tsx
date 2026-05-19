import { clsx } from "clsx";
import type { SelectHTMLAttributes } from "react";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx("w-full border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-blue", className)} {...props}>
      {children}
    </select>
  );
}
