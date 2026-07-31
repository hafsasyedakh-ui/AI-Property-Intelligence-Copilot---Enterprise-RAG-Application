import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.models import Chat
from app.schemas.schemas import ChatRequest, ChatResponse, SourceOut
from app.services.embedding_service import search_similar
from app.services.llm_service import answer_question

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    top_chunks = search_similar(db, req.question, top_k=5, doc_type_filter=req.doc_type_filter)

    if not top_chunks:
        answer = "I don't have any relevant documents to answer that yet. Try uploading some PDFs first."
        sources = []
    else:
        answer = answer_question(req.question, top_chunks)
        sources = [
            SourceOut(filename=c["filename"], page=c["page_number"], snippet=c["text"][:180])
            for c in top_chunks
        ]

    chat_record = Chat(
        question=req.question,
        response=answer,
        sources=json.dumps([s.model_dump() for s in sources]),
    )
    db.add(chat_record)
    db.commit()

    return ChatResponse(answer=answer, sources=sources)


@router.get("/history")
def history(db: Session = Depends(get_db)):
    chats = db.query(Chat).order_by(Chat.timestamp.desc()).limit(50).all()
    return [
        {
            "id": c.id,
            "question": c.question,
            "response": c.response,
            "sources": json.loads(c.sources),
            "timestamp": c.timestamp,
        }
        for c in chats
    ]
