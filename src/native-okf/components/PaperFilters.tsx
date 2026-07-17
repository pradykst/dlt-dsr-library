"use client";

interface PaperFiltersProps {
  query: string;
  year: string;
  venue: string;
  tag: string;
  years: string[];
  venues: string[];
  tags: string[];
  resultCount: number;
  totalCount: number;
  onQueryChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onVenueChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onReset: () => void;
}

const selectClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";

export function PaperFilters({
  query,
  year,
  venue,
  tag,
  years,
  venues,
  tags,
  resultCount,
  totalCount,
  onQueryChange,
  onYearChange,
  onVenueChange,
  onTagChange,
  onReset,
}: PaperFiltersProps) {
  const hasFilters = Boolean(query || year || venue || tag);

  return (
    <section
      aria-label="Paper filters"
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1.6fr)_repeat(3,minmax(9rem,1fr))]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Search papers
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Title, author, venue, year, tag…"
            className={selectClassName}
          />
        </label>

        <FilterSelect label="Year" value={year} onChange={onYearChange} options={years} />
        <FilterSelect
          label="Venue"
          value={venue}
          onChange={onVenueChange}
          options={venues}
        />
        <FilterSelect label="Tag" value={tag} onChange={onTagChange} options={tags} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
        <p aria-live="polite" className="text-slate-600">
          Showing <strong className="font-semibold text-slate-950">{resultCount}</strong> of{" "}
          {totalCount} papers
        </p>
        <button
          type="button"
          onClick={onReset}
          disabled={!hasFilters}
          className="rounded-lg px-3 py-1.5 font-medium text-blue transition hover:bg-blue/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear filters
        </button>
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClassName}
      >
        <option value="">All {label.toLowerCase()}s</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
