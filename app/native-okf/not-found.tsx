import Link from "next/link";

export default function NativeOkfNotFound() {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <span className="rounded-full border border-amber/30 bg-amber/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber">
        Native OKF
      </span>
      <h1 className="mt-5 font-serif text-4xl font-semibold text-slate-950">
        Concept not found
      </h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
        No concept document matches this bundle-relative path in the canonical native bundle.
      </p>
      <Link
        href="/native-okf"
        className="mt-7 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Return to the paper library
      </Link>
    </div>
  );
}
