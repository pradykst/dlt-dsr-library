import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getNativeOkfPublicOrigin } from "@/src/native-okf/server/public-origin";
import { SiteHeader } from "@/components/layout/SiteHeader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  metadataBase: new URL(getNativeOkfPublicOrigin()),
  title: {
    default: "DSR Knowledge Library",
    template: "%s | DSR Knowledge Library",
  },
  description:
    "A research prototype for exploring and reusing source-linked design knowledge from Design Science Research publications.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
