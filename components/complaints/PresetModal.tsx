"use client";

import { useState } from "react";
import { X, BookmarkPlus } from "lucide-react";

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, isShared: boolean) => Promise<void>;
  isAdmin?: boolean;
}

export function PresetModal({ isOpen, onClose, onSave, isAdmin = false }: PresetModalProps) {
  const [name, setName] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name for the filter preset.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(name.trim(), isShared);
      setName("");
      setIsShared(false);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save preset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-lg">
            <BookmarkPlus className="h-5 w-5 text-blue-600" />
            <span>Save Filter Preset</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Preset Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Critical Breached Complaints"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isShared"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="isShared" className="text-xs font-semibold text-gray-700">
                Share this preset system-wide (Admin option)
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Preset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
