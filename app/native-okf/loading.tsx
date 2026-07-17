export default function NativeOkfLoading() {
  return (
    <div className="mx-auto min-h-[55vh] max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-5" aria-label="Loading native OKF content">
        <div className="h-4 w-36 rounded bg-slate-200" />
        <div className="h-12 max-w-2xl rounded-xl bg-slate-200" />
        <div className="h-24 rounded-2xl bg-white shadow-sm" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-72 rounded-2xl bg-white shadow-sm" />
          <div className="h-72 rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    </div>
  );
}
