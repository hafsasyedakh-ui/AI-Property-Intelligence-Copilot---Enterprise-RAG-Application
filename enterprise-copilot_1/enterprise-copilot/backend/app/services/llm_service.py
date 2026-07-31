from app.services.embedding_service import get_client
from app.config import settings

SYSTEM_PROMPT = """You are an enterprise property management assistant.
Only answer using the provided context chunks. Each chunk is labeled with its
source filename and page number.
If the answer is not in the context, say you don't know rather than guessing.
Always cite the filename and page number for every claim you make, in the
format (Source: <filename>, Page <n>)."""


def build_context_block(chunks: list[dict]) -> str:
    parts = []
    for c in chunks:
        parts.append(f"[Source: {c['filename']}, Page {c['page_number']}]\n{c['text']}")
    return "\n\n---\n\n".join(parts)


def answer_question(question: str, chunks: list[dict]) -> str:
    client = get_client()
    context = build_context_block(chunks)
    user_prompt = f"Context:\n{context}\n\nQuestion: {question}"

    resp = client.chat.completions.create(
        model=settings.chat_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )
    return resp.choices[0].message.content


REPORT_SYSTEM_PROMPT = """You are an enterprise property management analyst.
Given excerpts from multiple property documents (leases, inspections,
invoices, maintenance logs), produce an executive summary with these
sections, each as a markdown heading: Key Findings, Risks, Recommendations,
Important Dates, Financial Obligations. Cite filename and page for each
specific claim. Be concise and use bullet points."""


def generate_report_summary(title: str, chunks: list[dict]) -> str:
    client = get_client()
    context = build_context_block(chunks)
    user_prompt = f"Report title: {title}\n\nDocument excerpts:\n{context}"

    resp = client.chat.completions.create(
        model=settings.chat_model,
        messages=[
            {"role": "system", "content": REPORT_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )
    return resp.choices[0].message.content
