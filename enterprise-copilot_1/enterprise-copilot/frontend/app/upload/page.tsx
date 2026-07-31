"use client";

import { useCallback, useState } from "react";
import { UploadCloud, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

const DOC_TYPES = ["general", "lease", "inspection", "invoice", "maintenance"];

type QueueItem = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

export default function UploadPage() {
  const [docType, setDocType] = useState("general");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const pdfFiles = Array.from(files).filter((f) => f.type === "application/pdf");
    setQueue((q) => [...q, ...pdfFiles.map((file) => ({ file, status: "pending" as const }))]);
  }, []);

  const uploadAll = async () => {
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status !== "pending") continue;
      setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: "uploading" } : item)));
      try {
        await api.uploadDocument(queue[i].file, docType);
        setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: "done" } : item)));
      } catch (e: any) {
        setQueue((q) =>
          q.map((item, idx) =>
            idx === i ? { ...item, status: "error", error: e.message } : item
          )
        );
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Upload documents"
        subtitle="Leases, inspection reports, invoices, and maintenance logs — PDF only."
      />

      <div className="card p-4 mb-6 max-w-md">
        <label className="text-sm font-medium text-ink block mb-2">Document type</label>
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

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`card border-2 border-dashed p-12 text-center transition-colors ${
          dragActive ? "border-accent bg-accent/5" : "border-border"
        }`}
      >
        <UploadCloud size={32} className="mx-auto mb-3 text-accent" />
        <p className="text-sm text-ink font-medium mb-1">
          Drag PDFs here, or{" "}
          <label className="text-accent cursor-pointer underline">
            browse
            <input
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
        </p>
        <p className="text-xs text-muted">PDF files only</p>
      </div>

      {queue.length > 0 && (
        <div className="card mt-6 p-4">
          <ul className="divide-y divide-border">
            {queue.map((item, idx) => (
              <li key={idx} className="py-3 flex items-center justify-between text-sm">
                <span className="text-ink truncate max-w-[60%]">{item.file.name}</span>
                <StatusIcon status={item.status} error={item.error} />
              </li>
            ))}
          </ul>
          <button
            onClick={uploadAll}
            className="mt-4 bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Upload {queue.filter((q) => q.status === "pending").length} file(s)
          </button>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status, error }: { status: QueueItem["status"]; error?: string }) {
  if (status === "pending") return <span className="text-xs text-muted">Queued</span>;
  if (status === "uploading")
    return <Loader2 size={16} className="animate-spin text-accent" />;
  if (status === "done") return <CheckCircle2 size={16} className="text-green-600" />;
  return (
    <span className="flex items-center gap-1 text-red-600 text-xs" title={error}>
      <XCircle size={16} /> Failed
    </span>
  );
}
