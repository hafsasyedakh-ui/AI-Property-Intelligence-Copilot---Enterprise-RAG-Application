"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, FileBarChart } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api, Report } from "@/lib/api";

const DOC_TYPES = ["all", "general", "lease", "inspection", "invoice", "maintenance"];

export default function ReportsPage() {
  const [title, setTitle] = useState("Q3 Portfolio Executive Summary");
  const [docType, setDocType] = useState("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listReports().then(setReports);
  }, []);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const report = await api.generateReport(title, docType === "all" ? undefined : docType);
      setReports((r) => [report, ...r]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate an executive summary across your document set: key findings, risks, recommendations, dates, and financial obligations."
      />

      <div className="card p-5 mb-8 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-ink block mb-1">Report title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="text-sm font-medium text-ink block mb-1">Document type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
        >
          {generating ? <Loader2 size={15} className="animate-spin" /> : <FileBarChart size={15} />}
          Generate Executive Summary
        </button>
      </div>

      {error && (
        <div className="card p-4 mb-6 text-sm text-red-600 border-red-200 bg-red-50">{error}</div>
      )}

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">
            No reports yet. Generate your first one above.
          </div>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="card p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading font-semibold text-ink">{r.title}</h3>
                  <p className="text-xs text-muted">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <a
                  href={api.reportPdfUrl(r.id)}
                  className="flex items-center gap-1.5 text-sm text-accent border border-accent/30 rounded-lg px-3 py-1.5 hover:bg-accent/5 transition-colors"
                >
                  <Download size={14} /> PDF
                </a>
              </div>
              <div className="text-sm text-ink whitespace-pre-wrap max-h-64 overflow-y-auto bg-black/[0.02] rounded-lg p-4">
                {r.summary}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
