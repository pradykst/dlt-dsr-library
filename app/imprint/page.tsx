import type { Metadata } from "next";
import { NativeOkfShell } from "@/src/native-okf/components/NativeOkfShell";

export const metadata: Metadata = { title: "Imprint" };

export default function ImprintPage() {
  return <NativeOkfShell title="Imprint" eyebrow="Legal" breadcrumbs={[{ label: "Imprint" }]}>
    <div className="max-w-3xl space-y-8 text-sm leading-7 text-ink [&_h2]:mb-3 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_a]:break-words [&_a]:text-blue [&_a]:underline">
      <section>
        <h2>Research and project contact</h2>
        <p>Max Gräser<br />Research Assistant<br />Information Systems Institute<br />Chair of Application Systems<br />Universität Leipzig<br />Grimmaische Straße 12, Room I 230<br />04109 Leipzig<br />Germany<br />Telephone: <a href="tel:+493419733605">+49 341 97 33605</a><br />Email: <a href="mailto:max.graeser@uni-leipzig.de">max.graeser@uni-leipzig.de</a></p>
      </section>
      <p><a href="https://www.wifa.uni-leipzig.de/impressum" target="_blank" rel="noopener noreferrer">Official Faculty legal notice</a></p>
    </div>
  </NativeOkfShell>;
}
