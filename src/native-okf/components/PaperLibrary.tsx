"use client";

import { useDeferredValue, useMemo, useState } from "react";

import type { LibraryViewModel } from "../shared/types.ts";
import { PaperCard } from "./PaperCard.tsx";
import { PaperFilters } from "./PaperFilters.tsx";

export function PaperLibrary({ library }: { library: LibraryViewModel }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [venue, setVenue] = useState("");
  const [tag, setTag] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());

  const visiblePapers = useMemo(
    () =>
      library.papers.filter((paper) => {
        if (year && paper.search.year !== year) return false;
        if (venue && paper.search.venue !== venue) return false;
        if (tag && !paper.search.tags.includes(tag)) return false;
        if (!deferredQuery) return true;

        const haystack = [
          paper.search.title,
          paper.search.description,
          paper.search.year,
          paper.search.venue,
          ...paper.search.authors,
          ...paper.search.tags,
        ]
          .join("\n")
          .toLocaleLowerCase();
        return haystack.includes(deferredQuery);
      }),
    [deferredQuery, library.papers, tag, venue, year],
  );

  function resetFilters() {
    setQuery("");
    setYear("");
    setVenue("");
    setTag("");
  }

  return (
    <div className="space-y-7">
      <PaperFilters
        query={query}
        year={year}
        venue={venue}
        tag={tag}
        years={library.filterOptions.years}
        venues={library.filterOptions.venues}
        tags={library.filterOptions.tags}
        resultCount={visiblePapers.length}
        totalCount={library.papers.length}
        onQueryChange={setQuery}
        onYearChange={setYear}
        onVenueChange={setVenue}
        onTagChange={setTag}
        onReset={resetFilters}
      />

      {visiblePapers.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {visiblePapers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
          <h2 className="font-serif text-2xl font-semibold text-slate-950">
            No matching papers
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Try a broader search or clear one of the metadata filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
