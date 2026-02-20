from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from io import BytesIO


def generate_resume_pdf(resume_text: str, filename: str) -> bytes:
    """Generate a simple resume PDF"""

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )

    styles = getSampleStyleSheet()
    story = []

    # Convert text to paragraphs
    lines = resume_text.split('\n')

    for line in lines:
        if line.strip():
            # Clean special chars
            clean_line = line.replace('&', '&amp;').replace(
                '<', '&lt;').replace('>', '&gt;')
            clean_line = clean_line.replace('•', '-')

            story.append(Paragraph(clean_line, styles['Normal']))
        else:
            story.append(Spacer(1, 0.1*inch))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
