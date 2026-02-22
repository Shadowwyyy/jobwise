from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib import colors
from io import BytesIO
import re


def make_styles():
    name_style = ParagraphStyle(
        'Name',
        fontName='Times-Bold',
        fontSize=15,
        leading=18,
        alignment=TA_CENTER,
        spaceAfter=1,
    )
    contact_style = ParagraphStyle(
        'Contact',
        fontName='Times-Roman',
        fontSize=9,
        leading=11,
        alignment=TA_CENTER,
        spaceAfter=4,
        textColor=colors.HexColor('#222222'),
    )
    section_header_style = ParagraphStyle(
        'SectionHeader',
        fontName='Times-Bold',
        fontSize=9.5,
        leading=12,
        spaceBefore=5,
        spaceAfter=2,
        textColor=colors.black,
    )
    body_style = ParagraphStyle(
        'Body',
        fontName='Times-Roman',
        fontSize=9,
        leading=11.5,
        spaceAfter=1,
    )
    bullet_style = ParagraphStyle(
        'Bullet',
        fontName='Times-Roman',
        fontSize=9,
        leading=11.5,
        leftIndent=12,
        firstLineIndent=0,
        spaceAfter=1,
    )
    bold_body_style = ParagraphStyle(
        'BoldBody',
        fontName='Times-Bold',
        fontSize=9,
        leading=11.5,
        spaceAfter=1,
        spaceBefore=3,
    )
    return {
        'name': name_style,
        'contact': contact_style,
        'section_header': section_header_style,
        'body': body_style,
        'bullet': bullet_style,
        'bold_body': bold_body_style,
    }


def clean(text: str) -> str:
    return (text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;'))


def is_bullet(line: str) -> bool:
    return bool(re.match(r'^[•\-\*\u2022]\s', line.strip()))


def strip_bullet(line: str) -> str:
    return re.sub(r'^[•\-\*\u2022]\s*', '', line.strip())


def is_job_header(line: str) -> bool:
    return '–' in line or '—' in line or bool(re.search(r'\b(20\d{2}|19\d{2})\b', line))


def render_header(text: str, styles: dict, story: list):
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if not lines:
        return
    story.append(Paragraph(clean(lines[0]), styles['name']))
    for line in lines[1:]:
        story.append(Paragraph(clean(line), styles['contact']))


def render_section(title: str, text: str, styles: dict, story: list):
    story.append(HRFlowable(
        width='100%',
        thickness=0.5,
        color=colors.black,
        spaceBefore=4,
        spaceAfter=2,
    ))
    story.append(Paragraph(title.upper(), styles['section_header']))

    for line in text.split('\n'):
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.upper() in (title.upper(), title.upper() + ':'):
            continue
        if is_bullet(stripped):
            story.append(
                Paragraph(f'• {clean(strip_bullet(stripped))}', styles['bullet']))
        elif is_job_header(stripped):
            story.append(Paragraph(clean(stripped), styles['bold_body']))
        else:
            story.append(Paragraph(clean(stripped), styles['body']))


SECTION_TITLES = {
    'education': 'Education',
    'skills': 'Skills',
    'experience': 'Experience',
    'projects': 'Projects',
    'summary': 'Summary',
}


def generate_resume_pdf(resume_data: dict | str, filename: str = "resume.pdf") -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    styles = make_styles()
    story = []

    if isinstance(resume_data, dict):
        section_order = ['header', 'education',
                         'skills', 'experience', 'projects']
        for section_key in section_order:
            if section_key not in resume_data or not resume_data[section_key]:
                continue
            text = resume_data[section_key]
            if section_key == 'header':
                render_header(text, styles, story)
            else:
                title = SECTION_TITLES.get(section_key, section_key.title())
                render_section(title, text, styles, story)
    else:
        for line in resume_data.split('\n'):
            stripped = line.strip()
            if stripped:
                if is_bullet(stripped):
                    story.append(
                        Paragraph(f'• {clean(strip_bullet(stripped))}', styles['bullet']))
                else:
                    story.append(Paragraph(clean(stripped), styles['body']))
            else:
                story.append(Spacer(1, 0.06 * inch))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
