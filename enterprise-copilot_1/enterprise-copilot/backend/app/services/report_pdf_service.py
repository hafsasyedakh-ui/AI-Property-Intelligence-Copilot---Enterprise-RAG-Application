import re
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch

OUTPUT_DIR = Path("./reports")
OUTPUT_DIR.mkdir(exist_ok=True)


def markdown_to_pdf(title: str, markdown_text: str, report_id: str) -> str:
    path = str(OUTPUT_DIR / f"{report_id}.pdf")
    styles = getSampleStyleSheet()
    heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], spaceBefore=12, spaceAfter=6)
    body_style = styles["BodyText"]

    doc = SimpleDocTemplate(path, pagesize=letter)
    story = [Paragraph(title, styles["Title"]), Spacer(1, 0.25 * inch)]

    for line in markdown_text.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("### ") or line.startswith("## ") or line.startswith("# "):
            text = re.sub(r"^#+\s*", "", line)
            story.append(Paragraph(text, heading_style))
        elif line.startswith("- ") or line.startswith("* "):
            story.append(Paragraph(f"&bull; {line[2:]}", body_style))
        else:
            story.append(Paragraph(line, body_style))

    doc.build(story)
    return path
