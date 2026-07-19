import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Page unavailable",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UnavailableLegacyRoutePage(): never {
  notFound();
}
