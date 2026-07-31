from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import Base, engine
from app.models import models  # noqa: F401 ensures models are registered
from app.routers import upload, documents, chat, report

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Enterprise Property Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(report.router)


@app.get("/health")
def health():
    return {"status": "ok"}
