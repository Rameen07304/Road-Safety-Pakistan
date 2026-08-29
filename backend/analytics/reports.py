from collections import Counter
from datetime import datetime
from io import BytesIO

from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from complaints.models import Complaint

PAGE_SIZE = A4
MARGIN = 2 * cm


def _add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(PAGE_SIZE[0] - MARGIN, 1 * cm, f"Page {doc.page}")
    canvas.restoreState()


def _hazard_label(complaint):
    if isinstance(complaint.detected_classes, list) and complaint.detected_classes:
        return ", ".join(complaint.detected_classes)
    return "Unclassified"


def build_report_pdf(start_date=None, end_date=None):
    """Build the admin analytics PDF report and return it as raw bytes.

    start_date / end_date are optional date objects (inclusive) used to
    filter complaints by their submission date. When omitted, all
    complaints are included.
    """
    queryset = Complaint.objects.all()
    if start_date:
        queryset = queryset.filter(submitted_at__date__gte=start_date)
    if end_date:
        queryset = queryset.filter(submitted_at__date__lte=end_date)

    complaints = list(queryset)

    total_complaints = len(complaints)
    resolved_complaints = sum(1 for c in complaints if c.status == "resolved")
    resolution_rate = (
        round((resolved_complaints / total_complaints) * 100, 2) if total_complaints else 0.0
    )

    hazard_counter = Counter()
    ward_counter = Counter()
    for complaint in complaints:
        hazard_counter[_hazard_label(complaint)] += 1
        ward_counter[complaint.ward or "Unknown"] += 1

    top_unresolved = sorted(
        [c for c in complaints if c.status != "resolved"],
        key=lambda c: c.upvotes,
        reverse=True,
    )[:10]

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=PAGE_SIZE,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title="Road Safety Pakistan - Complaint Analytics Report",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle", parent=styles["Title"], fontSize=20, spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle", parent=styles["Normal"], fontSize=13, textColor=colors.HexColor("#2f6a4d"),
        spaceAfter=10,
    )
    meta_style = ParagraphStyle(
        "ReportMeta", parent=styles["Normal"], fontSize=9, textColor=colors.HexColor("#555555"),
    )
    section_style = ParagraphStyle(
        "SectionHeading", parent=styles["Heading2"], fontSize=13,
        textColor=colors.HexColor("#173b2b"), spaceBefore=16, spaceAfter=8,
    )
    body_style = styles["Normal"]

    elements = []

    elements.append(Paragraph("Road Safety Pakistan", title_style))
    elements.append(Paragraph("Complaint Analytics Report", subtitle_style))

    generated_at = timezone.localtime().strftime("%B %d, %Y at %I:%M %p")
    elements.append(Paragraph(f"Generated on: {generated_at}", meta_style))

    if start_date or end_date:
        start_label = start_date.strftime("%B %d, %Y") if start_date else "the beginning"
        end_label = end_date.strftime("%B %d, %Y") if end_date else "the present"
        date_range_text = f"Date range: {start_label} to {end_label}"
    else:
        date_range_text = "Date range: All available complaints"
    elements.append(Paragraph(date_range_text, meta_style))
    elements.append(Spacer(1, 0.6 * cm))

    # Summary
    elements.append(Paragraph("Summary", section_style))
    summary_data = [
        ["Total Complaints", str(total_complaints)],
        ["Resolved Complaints", str(resolved_complaints)],
        ["Resolution Rate", f"{resolution_rate}%"],
    ]
    summary_table = Table(summary_data, colWidths=[8 * cm, 6 * cm])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef6f0")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d6e3d9")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    elements.append(summary_table)

    # Breakdown by hazard type
    elements.append(Paragraph("Breakdown by Hazard Type", section_style))
    if hazard_counter:
        hazard_rows = [["Hazard Type", "Number of Complaints"]]
        hazard_rows += [
            [hazard, str(count)]
            for hazard, count in sorted(hazard_counter.items(), key=lambda item: item[1], reverse=True)
        ]
        elements.append(_make_table(hazard_rows))
    else:
        elements.append(Paragraph("No complaint data available for this date range.", body_style))

    # Breakdown by ward
    elements.append(Paragraph("Breakdown by Ward", section_style))
    if ward_counter:
        ward_rows = [["Ward", "Number of Complaints"]]
        ward_rows += [
            [ward, str(count)]
            for ward, count in sorted(ward_counter.items(), key=lambda item: item[1], reverse=True)
        ]
        elements.append(_make_table(ward_rows))
    else:
        elements.append(Paragraph("No complaint data available for this date range.", body_style))

    # Top 10 most upvoted unresolved complaints
    elements.append(Paragraph("Top 10 Most Upvoted Unresolved Complaints", section_style))
    if top_unresolved:
        top_rows = [["Complaint ID", "Hazard Type", "Ward", "Upvotes", "Status"]]
        for complaint in top_unresolved:
            top_rows.append(
                [
                    complaint.complaint_id,
                    _hazard_label(complaint),
                    complaint.ward or "Unknown",
                    str(complaint.upvotes),
                    complaint.get_status_display(),
                ]
            )
        elements.append(_make_table(top_rows, col_widths=[3.2 * cm, 4.3 * cm, 3.5 * cm, 2 * cm, 3 * cm]))
    else:
        elements.append(Paragraph("No unresolved complaints with upvotes in this date range.", body_style))

    doc.build(elements, onFirstPage=_add_page_number, onLaterPages=_add_page_number)
    return buffer.getvalue()


def _make_table(rows, col_widths=None):
    table = Table(rows, colWidths=col_widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#173b2b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d6e3d9")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f6fbf7")]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table
