"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, MessageSquare, FileBarChart, HardDrive, ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api, Document } from "@/lib/api";

export default function Dashboard() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [chatCount, setChatCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listDocuments(), api.chatHistory(), api.listReports()])
      .then(([documents, chats, reports]) => {
        setDocs(documents);
        setChatCount(chats.length);
        setReportCount(reports.length);
      })
      .catch(() => setError("Can't reach the backend. Is it running on :8000?"))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Uploaded Documents", value: docs.length, icon: FileText },
    { label: "Recent Chats", value: chatCount, icon: MessageSquare },
    { label: "Reports Generated", value: reportCount, icon: FileBarChart },
    {
      label: "Storage Used",
      value: `${docs.reduce((sum, d) => sum + d.page_count, 0)} pages`,
      icon: HardDrive,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your property document intelligence."
      />

      {error && (
        <div className="card p-4 mb-6 text-sm text-red-600 border-red-200 bg-red-50">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <Icon size={18} className="text-accent" />
            </div>
            <div className="font-heading text-2xl font-semibold text-ink">
              {loading ? "—" : value}
            </div>
            <div className="text-sm text-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-ink">Recent documents</h2>
            <Link href="/documents" className="text-sm text-accent flex items-center gap-1">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {docs.length === 0 ? (
            <EmptyState
              text="No documents yet. Upload a lease, inspection report, or invoice to get started."
              href="/upload"
              cta="Upload a document"
            />
          ) : (
            <ul className="divide-y divide-border">
              {docs.slice(0, 5).map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between text-sm">
                  <span className="text-ink truncate max-w-[60%]">{d.filename}</span>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-heading font-semibold text-ink mb-4">Ask something</h2>
          <p className="text-sm text-muted mb-4">
            Ask a question across every uploaded document and get an answer with page-level
            citations.
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
          >
            <MessageSquare size={16} /> Open AI Chat
          </Link>
        </div>
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

function EmptyState({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted mb-4">{text}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}
