import type { Metadata } from "next";
import { NativeOkfShell } from "@/src/native-okf/components/NativeOkfShell";

export const metadata: Metadata = { title: "Imprint" };

export default function ImprintPage() {
  return <NativeOkfShell title="Imprint" eyebrow="Legal" breadcrumbs={[{ label: "Imprint" }]}>
    <div className="max-w-3xl space-y-8 text-sm leading-7 text-ink [&_h2]:mb-3 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_a]:break-words [&_a]:text-blue [&_a]:underline">
      <section>
        <h2>Institution</h2>
        <p>Universität Leipzig<br />Ritterstraße 26<br />04109 Leipzig<br />Germany</p>
        <p className="mt-3">Legal form: Corporation under public law.<br />Represented by the Rector: Prof. Dr. Eva Inés Obergfell</p>
        <p className="mt-3">VAT identification number: DE 141510383</p>
      </section>
      <section>
        <h2>Supervisory authority</h2>
        <p>Sächsisches Staatsministerium für Wissenschaft, Kultur und Tourismus<br />Wigardstraße 17<br />01097 Dresden<br />Germany</p>
      </section>
      <section>
        <h2>Content responsibility</h2>
        <p>Universität Leipzig<br />Faculty of Business and Economics<br />Dean: Prof. Dr. Rainer Alt<br />Grimmaische Straße 12<br />04109 Leipzig<br />Germany<br />Telephone: <a href="tel:+493419733500">+49 341 97-33500</a></p>
      </section>
      <section>
        <h2>Research and project contact</h2>
        <p>Max Gräser<br />Research Assistant<br />Information Systems Institute<br />Chair of Application Systems<br />Universität Leipzig<br />Grimmaische Straße 12, Room I 230<br />04109 Leipzig<br />Germany<br />Telephone: <a href="tel:+493419733605">+49 341 97 33605</a><br />Email: <a href="mailto:max.graeser@uni-leipzig.de">max.graeser@uni-leipzig.de</a></p>
      </section>
      <p><a href="https://www.wifa.uni-leipzig.de/impressum" target="_blank" rel="noopener noreferrer">Official Faculty legal notice</a></p>
    </div>
  </NativeOkfShell>;
}
