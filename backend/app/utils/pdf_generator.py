from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib import colors
from io import BytesIO
import re


# ── Styles ──────────────────────────────────────────────────────────────────

def make_styles():
    name_style = ParagraphStyle(
        'Name',
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        alignment=TA_CENTER,
        spaceAfter=2,
    )
    contact_style = ParagraphStyle(
        'Contact',
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        spaceAfter=6,
        textColor=colors.HexColor('#444444'),
    )
    section_header_style = ParagraphStyle(
        'SectionHeader',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        spaceBefore=10,
        spaceAfter=3,
        textColor=colors.HexColor('#000000'),
    )
    body_style = ParagraphStyle(
        'Body',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        spaceAfter=2,
    )
    bullet_style = ParagraphStyle(
        'Bullet',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        leftIndent=14,
        spaceAfter=2,
        bulletIndent=4,
    )
    bold_body_style = ParagraphStyle(
        'BoldBody',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        spaceAfter=1,
    )
    return {
        'name': name_style,
        'contact': contact_style,
        'section_header': section_header_style,
        'body': body_style,
        'bullet': bullet_style,
        'bold_body': bold_body_style,
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

def clean(text: str) -> str:
    """Escape XML special chars for ReportLab"""
    return (text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;'))


def is_bullet(line: str) -> bool:
    return line.startswith('•') or line.startswith('-') or line.startswith('*') or re.match(r'^\u2022', line)


def strip_bullet(line: str) -> str:
    return re.sub(r'^[•\-\*\u2022]\s*', '', line).strip()


def is_section_label(line: str) -> bool:
    """Detect lines like 'EDUCATION', 'SKILLS', 'EXPERIENCE' etc."""
    upper_keywords = ['EDUCATION', 'SKILLS', 'EXPERIENCE', 'PROJECTS',
                      'SUMMARY', 'OBJECTIVE', 'CERTIFICATIONS', 'AWARDS',
                      'LANGUAGES', 'INTERESTS', 'WORK EXPERIENCE']
    stripped = line.strip().upper()
    return any(stripped == kw or stripped.startswith(kw) for kw in upper_keywords)


# ── Section renderers ────────────────────────────────────────────────────────

def render_header(text: str, styles: dict, story: list):
    """Render name + contact info centered at top"""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if not lines:
        return

    # First line = name
    story.append(Paragraph(clean(lines[0]), styles['name']))

    # Remaining lines = contact info
    for line in lines[1:]:
        story.append(Paragraph(clean(line), styles['contact']))


def render_section(title: str, text: str, styles: dict, story: list):
    """Render a labeled resume section with proper bullet formatting"""
    story.append(HRFlowable(width='100%', thickness=0.5,
                 color=colors.HexColor('#cccccc'), spaceAfter=3))
    story.append(Paragraph(title.upper(), styles['section_header']))

    lines = [l for l in text.split('\n')]
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue

        if is_bullet(line):
            content = clean(strip_bullet(line))
            story.append(Paragraph(f'• {content}', styles['bullet']))
        elif is_section_label(line):
            # Skip if it's just echoing the section name
            i += 1
            continue
        else:
            # Check if next line(s) are bullets — if so, this is a job/school header
            next_is_bullet = (i + 1 < len(lines)
                              and is_bullet(lines[i + 1].strip()))
            if next_is_bullet or '–' in line or re.search(r'\d{4}', line):
                story.append(Paragraph(clean(line), styles['bold_body']))
            else:
                story.append(Paragraph(clean(line), styles['body']))

        i += 1


SECTION_TITLES = {
    'header': None,  # special handling
    'education': 'Education',
    'skills': 'Skills',
    'experience': 'Experience',
    'projects': 'Projects',
    'summary': 'Summary',
    'certifications': 'Certifications',
}


# ── Main generator ───────────────────────────────────────────────────────────

def generate_resume_pdf(resume_data: dict | str, filename: str = "resume.pdf") -> bytes:
    """
    Generate a formatted resume PDF.

    Accepts either:
    - dict: parsed_data dict with keys like 'header', 'experience', etc.
    - str: raw resume text (fallback, renders as plain formatted text)
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.65 * inch,
    )

    styles = make_styles()
    story = []

    if isinstance(resume_data, dict):
        # Structured rendering
        section_order = ['header', 'education',
                         'skills', 'experience', 'projects']

        for section_key in section_order:
            if section_key not in resume_data or not resume_data[section_key]:
                continue

            text = resume_data[section_key]

            if section_key == 'header':
                render_header(text, styles, story)
                story.append(Spacer(1, 0.05 * inch))
            else:
                title = SECTION_TITLES.get(section_key, section_key.title())
                render_section(title, text, styles, story)
                story.append(Spacer(1, 0.04 * inch))

    else:
        # Fallback: plain text rendering
        lines = resume_data.split('\n')
        for line in lines:
            if line.strip():
                cleaned = clean(line)
                if is_bullet(line):
                    story.append(
                        Paragraph(f'• {clean(strip_bullet(line))}', styles['bullet']))
                else:
                    story.append(Paragraph(cleaned, styles['body']))
            else:
                story.append(Spacer(1, 0.08 * inch))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
