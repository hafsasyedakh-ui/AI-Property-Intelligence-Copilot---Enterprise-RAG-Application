"use client";

import { useEffect, useState } from "react";
import { Trash2, FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api, Document } from "@/lib/api";

const TYPE_FILTERS = ["all", "general", "lease", "inspection", "invoice", "maintenance"];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .listDocuments()
      .then(setDocs)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    const anyProcessing = docs.some((d) => d.status === "processing");
    if (!anyProcessing) return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [docs]);

  const filtered = filter === "all" ? docs : docs.filter((d) => d.doc_type === filter);

  const remove = async (id: string) => {
    await api.deleteDocument(id);
    setDocs((d) => d.filter((doc) => doc.id !== id));
  };

  return (
    <div>
      <PageHeader title="Documents" subtitle="Everything you've uploaded and its processing status." />

      <div className="flex gap-2 mb-6">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === t
                ? "bg-canvas text-white border-canvas"
                : "border-border text-muted hover:bg-black/5"
            }`}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">No documents in this category.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-black/[0.02] text-left text-xs text-muted uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Document</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Pages</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Uploaded</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td className="px-5 py-3 flex items-center gap-2 text-ink">
                    <FileText size={15} className="text-muted" /> {d.filename}
                  </td>
                  <td className="px-5 py-3 text-muted capitalize">{d.doc_type}</td>
                  <td className="px-5 py-3 text-muted">{d.page_count || "—"}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {new Date(d.uploaded_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => remove(d.id)} className="text-muted hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ready: "bg-green-50 text-green-700 border-green-200",
    processing: "bg-amber-50 text-amber-700 border-amber-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status] || ""}`}>
      {status}
    </span>
  );
}
