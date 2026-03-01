"use client";

import { useState } from "react";

export default function AuditPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/catalog/audit", {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-4">Catalog Audit</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Running Audit…" : "Run Audit"}
        </button>
      </form>

      {error && (
        <div className="text-red-600 text-sm mb-4">
          Error: {error}
        </div>
      )}

      {result && (
        <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
