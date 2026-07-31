from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.models import Chunk, Document, Report
from app.schemas.schemas import ReportRequest, ReportOut
from app.services.llm_service import generate_report_summary
from app.services.report_pdf_service import markdown_to_pdf

router = APIRouter(prefix="/report", tags=["report"])


@router.post("", response_model=ReportOut)
def generate_report(req: ReportRequest, db: Session = Depends(get_db)):
    q = db.query(Chunk, Document).join(Document, Chunk.document_id == Document.id)
    if req.doc_type_filter:
        q = q.filter(Document.doc_type == req.doc_type_filter)
    rows = q.limit(60).all()  # cap context sent to the LLM

    if not rows:
        raise HTTPException(status_code=400, detail="No processed documents available for this filter")

    chunks = [
        {"text": c.text, "page_number": c.page_number, "filename": d.filename}
        for c, d in rows
    ]

    summary_markdown = generate_report_summary(req.title, chunks)

    report = Report(title=req.title, summary=summary_markdown)
    db.add(report)
    db.commit()
    db.refresh(report)

    pdf_path = markdown_to_pdf(req.title, summary_markdown, report.id)
    report.pdf_path = pdf_path
    db.commit()

    return report


@router.get("/{report_id}/pdf")
def download_report_pdf(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report or not report.pdf_path:
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(report.pdf_path, media_type="application/pdf", filename=f"{report.title}.pdf")


@router.get("", response_model=list[ReportOut])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.created_at.desc()).all()
