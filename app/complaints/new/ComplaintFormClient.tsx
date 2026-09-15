"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createComplaintAction } from "@/app/actions/complaints";
import { AlertCircle, Send, CheckCircle2, Paperclip, Loader2 } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  description: string | null;
  department: { name: string } | null;
}

interface ComplaintFormClientProps {
  categories: CategoryOption[];
}

const fieldClass =
  "w-full rounded-md border border-border bg-background p-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function ComplaintFormClient({ categories }: ComplaintFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successComplaintNumber, setSuccessComplaintNumber] = useState<string | null>(null);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      title,
      categoryId,
      description,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    };

    startTransition(async () => {
      const res = await createComplaintAction(payload);

      if (!res.success) {
        setError(res.error);
      } else {
        setSuccessComplaintNumber(res.data.complaintNumber);
        setTimeout(() => {
          router.push(`/complaints/${res.data.id}`);
        }, 1500);
      }
    });
  };

  if (successComplaintNumber) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Complaint submitted</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Reference{" "}
          <span className="font-mono font-medium text-primary">{successComplaintNumber}</span>.
          Redirecting to your complaint…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Unable to submit complaint</p>
            <p className="mt-0.5 text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      <section className="space-y-4 border-b border-border pb-8">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Details</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Describe the issue and choose the right category.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="category" className="block text-sm font-medium text-foreground">
            Category <span className="text-destructive">*</span>
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className={fieldClass}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.department?.name || "General"})
              </option>
            ))}
          </select>
          {selectedCategory?.description && (
            <p className="text-xs text-muted-foreground">{selectedCategory.description}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Broken street light outside 42 Market Street"
            required
            minLength={5}
            maxLength={150}
            className={fieldClass}
          />
          <p className="text-right text-xs text-muted-foreground">{title.length}/150</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium text-foreground">
            Description <span className="text-destructive">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="When did it start, how severe is it, any safety hazards…"
            required
            minLength={10}
            maxLength={3000}
            className={fieldClass}
          />
          <p className="text-right text-xs text-muted-foreground">{description.length}/3000</p>
        </div>
      </section>

      <section className="space-y-4 border-b border-border pb-8">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Location</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Help responders find the issue.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="location" className="block text-sm font-medium text-foreground">
            Location description <span className="text-destructive">*</span>
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Junction of Main Street and Oak Avenue"
            required
            minLength={3}
            maxLength={200}
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="latitude" className="block text-xs font-medium text-muted-foreground">
              Latitude (optional)
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 5.6037"
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="longitude" className="block text-xs font-medium text-muted-foreground">
              Longitude (optional)
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. -0.1870"
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3 border-b border-border pb-8">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Attachments</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Photos or documents can be added after submission on the complaint page.
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-md border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
          <Paperclip className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            After you submit, open the complaint to upload JPEG, PNG, WEBP, or PDF
            evidence (max 10 MB each).
          </p>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !title || !categoryId || !description || !location}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              Submit complaint
            </>
          )}
        </button>
      </div>
    </form>
  );
}
