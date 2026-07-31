"""Embedding generation + cosine-similarity vector search.

NOTE: This uses in-app cosine similarity over embeddings stored as JSON in
SQLite, which is fine for a demo / few thousand chunks. For production scale,
swap this for Postgres + pgvector: store `embedding` as a `vector(1536)`
column and replace `search_similar` with a `<=>` ORDER BY query. The rest of
the pipeline (chunking, chat, citations) doesn't change.
"""
import json
import numpy as np
from openai import OpenAI
from sqlalchemy.orm import Session
from app.config import settings
from app.models.models import Chunk, Document

_client = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    client = get_client()
    resp = client.embeddings.create(model=settings.embedding_model, input=texts)
    return [d.embedding for d in resp.data]


def embed_query(text: str) -> list[float]:
    return embed_texts([text])[0]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    a_norm = a / (np.linalg.norm(a, axis=1, keepdims=True) + 1e-10)
    b_norm = b / (np.linalg.norm(b) + 1e-10)
    return a_norm @ b_norm


def search_similar(db: Session, query: str, top_k: int = 5, doc_type_filter: str | None = None):
    query_vec = np.array(embed_query(query))

    q = db.query(Chunk, Document).join(Document, Chunk.document_id == Document.id)
    if doc_type_filter:
        q = q.filter(Document.doc_type == doc_type_filter)
    rows = q.all()

    if not rows:
        return []

    vectors = np.array([json.loads(c.embedding) for c, _ in rows])
    sims = cosine_similarity(vectors, query_vec)

    ranked = sorted(zip(rows, sims), key=lambda x: x[1], reverse=True)[:top_k]

    results = []
    for (chunk, doc), score in ranked:
        results.append({
            "text": chunk.text,
            "page_number": chunk.page_number,
            "filename": doc.filename,
            "score": float(score),
        })
    return results
