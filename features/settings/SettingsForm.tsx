"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction } from "./settings-actions";

const KEYS = [
  "APP_TIMEZONE",
  "pace_threshold_green",
  "pace_threshold_yellow",
] as const;

type Props = {
  initialSettings: Record<string, string>;
};

export function SettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    KEYS.forEach((k) => {
      o[k] = initialSettings[k] ?? (k === "APP_TIMEZONE" ? "Europe/Moscow" : k === "pace_threshold_green" ? "100" : "80");
    });
    return o;
  });
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleChange(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        await saveSettingsAction(settings);
        setMessage("Settings saved.");
      } catch (err) {
        console.error(err);
        setMessage("Failed to save.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <label className="block text-xs font-medium text-slate-600">
          APP_TIMEZONE
        </label>
        <input
          type="text"
          value={settings.APP_TIMEZONE ?? ""}
          onChange={(e) => handleChange("APP_TIMEZONE", e.target.value)}
          placeholder="Europe/Moscow"
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">
          Pace threshold green (%)
        </label>
        <input
          type="number"
          min={0}
          value={settings.pace_threshold_green ?? ""}
          onChange={(e) => handleChange("pace_threshold_green", e.target.value)}
          className="mt-1 w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">
          Pace threshold yellow (%)
        </label>
        <input
          type="number"
          min={0}
          value={settings.pace_threshold_yellow ?? ""}
          onChange={(e) => handleChange("pace_threshold_yellow", e.target.value)}
          className="mt-1 w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </div>
      {message && (
        <p className={`text-xs ${message.startsWith("Failed") ? "text-red-600" : "text-emerald-600"}`}>
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
