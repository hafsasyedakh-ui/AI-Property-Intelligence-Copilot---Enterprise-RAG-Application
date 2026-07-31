import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from app.database.db import Base


def gen_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, default=gen_id)
    filename = Column(String, nullable=False)
    path = Column(String, nullable=False)
    doc_type = Column(String, default="general")  # lease, inspection, invoice, maintenance
    status = Column(String, default="processing")  # processing, ready, failed
    page_count = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)


class Chunk(Base):
    __tablename__ = "chunks"
    id = Column(String, primary_key=True, default=gen_id)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    text = Column(Text, nullable=False)
    embedding = Column(Text, nullable=False)  # JSON-encoded float list
    page_number = Column(Integer, default=1)


class Chat(Base):
    __tablename__ = "chats"
    id = Column(String, primary_key=True, default=gen_id)
    question = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    sources = Column(Text, default="[]")  # JSON-encoded list of {filename, page}
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)


class Report(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    pdf_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
