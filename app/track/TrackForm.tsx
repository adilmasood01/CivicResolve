"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function TrackForm({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();

  return (
    <form
      className="track-form"
      action="/track"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const number = String(data.get("number") ?? "").trim();
        const params = new URLSearchParams();
        if (number) params.set("number", number);
        router.push(number ? `/track?${params.toString()}` : "/track");
      }}
    >
      <label htmlFor="number" className="track-label">
        Complaint number
      </label>
      <div className="track-row">
        <input
          id="number"
          name="number"
          type="text"
          defaultValue={defaultValue}
          placeholder="CMP-2026-000001"
          autoComplete="off"
          spellCheck={false}
          className="track-input"
        />
        <button type="submit" className="track-submit">
          <Search className="h-4 w-4" aria-hidden="true" />
          Look up
        </button>
      </div>
    </form>
  );
}
