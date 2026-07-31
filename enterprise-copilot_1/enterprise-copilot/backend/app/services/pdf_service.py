"""Extract text per page from a PDF using PyMuPDF (fitz)."""
import fitz  # PyMuPDF


def extract_pages(pdf_path: str) -> list[dict]:
    """Returns a list of {page_number, text}, 1-indexed pages."""
    pages = []
    with fitz.open(pdf_path) as doc:
        for i, page in enumerate(doc):
            text = page.get_text("text").strip()
            if text:
                pages.append({"page_number": i + 1, "text": text})
    return pages
