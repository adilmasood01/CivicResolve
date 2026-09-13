"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createComplaintAction } from "@/app/actions/complaints";
import { AlertCircle, Send, MapPin, CheckCircle2 } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  description: string | null;
  department: { name: string } | null;
}

interface ComplaintFormClientProps {
  categories: CategoryOption[];
}

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
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4 shadow-sm animate-in fade-in">
        <div className="mx-auto h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Complaint Submitted!</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Your complaint reference number is{" "}
          <strong className="text-blue-600 font-mono text-lg">{successComplaintNumber}</strong>.
          Redirecting to your complaint tracking page...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to submit complaint</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Category Select */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-900">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="w-full text-sm bg-gray-50 rounded-xl border border-gray-300 p-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition"
        >
          <option value="">-- Select a Category --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.department?.name || "General"})
            </option>
          ))}
        </select>
        {selectedCategory?.description && (
          <p className="text-xs text-gray-500 italic mt-1">
            {selectedCategory.description}
          </p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-900">
          Title / Short Summary <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Broken street light outside 42 Market Street"
          required
          minLength={5}
          maxLength={150}
          className="w-full text-sm bg-gray-50 rounded-xl border border-gray-300 p-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition"
        />
        <p className="text-xs text-gray-400 text-right">{title.length}/150</p>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-900">
          Detailed Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Please describe the issue in detail (when did it start, how severe is it, any safety hazards)..."
          required
          minLength={10}
          maxLength={3000}
          className="w-full text-sm bg-gray-50 rounded-xl border border-gray-300 p-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition"
        />
        <p className="text-xs text-gray-400 text-right">{description.length}/3000</p>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-blue-600" />
          Location Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Junction of Main Street and Oak Avenue, near Central Hospital"
          required
          minLength={3}
          maxLength={200}
          className="w-full text-sm bg-gray-50 rounded-xl border border-gray-300 p-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      {/* Optional Coordinates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Latitude (Optional)
          </label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="e.g. 5.6037"
            className="w-full text-xs bg-gray-50 rounded-lg border border-gray-300 p-2.5 outline-none focus:border-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Longitude (Optional)
          </label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="e.g. -0.1870"
            className="w-full text-xs bg-gray-50 rounded-lg border border-gray-300 p-2.5 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={isPending || !title || !categoryId || !description || !location}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-md disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span>{isPending ? "Submitting Complaint..." : "Submit Complaint"}</span>
        </button>
      </div>
    </form>
  );
}
