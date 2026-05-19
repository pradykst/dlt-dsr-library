import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx("w-full border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-blue", className)} {...props} />;
}
