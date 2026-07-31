const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Document = {
  id: string;
  filename: string;
  doc_type: string;
  status: "processing" | "ready" | "failed";
  page_count: number;
  uploaded_at: string;
};

export type Source = { filename: string; page: number; snippet: string };
export type ChatResponse = { answer: string; sources: Source[] };
export type Report = { id: string; title: string; summary: string; created_at: string };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API error ${res.status}: ${detail}`);
  }
  return res.json();
}

export const api = {
  listDocuments: () => request<Document[]>("/documents"),

  deleteDocument: (id: string) =>
    request(`/documents/${id}`, { method: "DELETE" }),

  uploadDocument: (file: File, docType: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("doc_type", docType);
    return request<Document>("/upload", { method: "POST", body: form });
  },

  askQuestion: (question: string, docTypeFilter?: string) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, doc_type_filter: docTypeFilter || null }),
    }),

  chatHistory: () => request<any[]>("/chat/history"),

  generateReport: (title: string, docTypeFilter?: string) =>
    request<Report>("/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, doc_type_filter: docTypeFilter || null }),
    }),

  listReports: () => request<Report[]>("/report"),

  reportPdfUrl: (id: string) => `${API_URL}/report/${id}/pdf`,
};
