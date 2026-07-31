import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.models import Document
from app.schemas.schemas import DocumentOut
from app.services.ingestion_service import process_document
from app.config import settings

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("", response_model=DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    doc_type: str = Form("general"),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    safe_name = f"{uuid.uuid4()}_{file.filename}"
    dest_path = Path(settings.upload_dir) / safe_name
    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    document = Document(
        filename=file.filename,
        path=str(dest_path),
        doc_type=doc_type,
        status="processing",
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    background_tasks.add_task(_run_ingestion, document.id)

    return document


def _run_ingestion(document_id: str):
    from app.database.db import SessionLocal
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            process_document(db, document)
    finally:
        db.close()
