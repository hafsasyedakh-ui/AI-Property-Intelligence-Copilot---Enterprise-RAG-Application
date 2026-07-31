import json
from sqlalchemy.orm import Session
from app.services.pdf_service import extract_pages
from app.services.chunk_service import chunk_pages
from app.services.embedding_service import embed_texts
from app.models.models import Document, Chunk


def process_document(db: Session, document: Document):
    """Full pipeline: extract -> chunk -> embed -> store. Updates document status."""
    try:
        pages = extract_pages(document.path)
        document.page_count = len(pages)

        chunks = chunk_pages(pages)
        if not chunks:
            document.status = "failed"
            db.commit()
            return

        texts = [c["text"] for c in chunks]
        embeddings = embed_texts(texts)

        for c, emb in zip(chunks, embeddings):
            db.add(Chunk(
                document_id=document.id,
                text=c["text"],
                embedding=json.dumps(emb),
                page_number=c["page_number"],
            ))

        document.status = "ready"
        db.commit()
    except Exception as e:
        document.status = "failed"
        db.commit()
        raise e
