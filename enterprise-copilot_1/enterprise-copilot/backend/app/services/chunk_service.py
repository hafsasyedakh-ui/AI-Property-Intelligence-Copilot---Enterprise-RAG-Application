"""Token-aware chunking with overlap, preserving page numbers.

Splits each page's text into ~chunk_size_tokens chunks with overlap. Chunks
never span pages, which keeps citations accurate (a common RAG failure mode
is losing table/section boundaries mid-chunk across pages).
"""
import tiktoken
from app.config import settings

_enc = None


def _get_encoder():
    global _enc
    if _enc is None:
        try:
            _enc = tiktoken.get_encoding("cl100k_base")
        except Exception:
            # Offline fallback: approximate tokens as whitespace-split words.
            # Real token counts will differ slightly from OpenAI's tokenizer,
            # but chunk boundaries will still be reasonable.
            _enc = _WordFallbackEncoder()
    return _enc


class _WordFallbackEncoder:
    def encode(self, text: str) -> list[str]:
        return text.split(" ")

    def decode(self, tokens: list[str]) -> str:
        return " ".join(tokens)


def chunk_pages(pages: list[dict]) -> list[dict]:
    """pages: [{page_number, text}] -> [{page_number, text}] (chunks)."""
    chunks = []
    size = settings.chunk_size_tokens
    overlap = settings.chunk_overlap_tokens

    enc = _get_encoder()

    for page in pages:
        tokens = enc.encode(page["text"])
        if len(tokens) <= size:
            chunks.append({"page_number": page["page_number"], "text": page["text"]})
            continue

        start = 0
        while start < len(tokens):
            end = min(start + size, len(tokens))
            chunk_tokens = tokens[start:end]
            chunk_text = enc.decode(chunk_tokens)
            chunks.append({"page_number": page["page_number"], "text": chunk_text})
            if end == len(tokens):
                break
            start = end - overlap

    return chunks
