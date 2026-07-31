from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DocumentOut(BaseModel):
    id: str
    filename: str
    doc_type: str
    status: str
    page_count: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    question: str
    doc_type_filter: Optional[str] = None


class SourceOut(BaseModel):
    filename: str
    page: int
    snippet: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceOut]


class ReportRequest(BaseModel):
    title: str
    doc_type_filter: Optional[str] = None


class ReportOut(BaseModel):
    id: str
    title: str
    summary: str
    created_at: datetime

    class Config:
        from_attributes = True
