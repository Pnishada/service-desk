from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app import models, database
from datetime import datetime
from io import BytesIO, StringIO
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import csv

router = APIRouter()

# =========================
# Completed Jobs Endpoint
# =========================
@router.get("/reports/completed")
def get_completed_jobs(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    technician: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(database.get_db),
):
    """
    Fetch completed tickets (status=CLOSED) with optional filters.
    """
    query = db.query(models.Ticket).filter(models.Ticket.status == "CLOSED")

    if date_from:
        try:
            date_from_dt = datetime.fromisoformat(date_from)
            query = query.filter(models.Ticket.completed_at >= date_from_dt)
        except ValueError:
            pass

    if date_to:
        try:
            date_to_dt = datetime.fromisoformat(date_to)
            query = query.filter(models.Ticket.completed_at <= date_to_dt)
        except ValueError:
            pass

    if technician:
        query = query.filter(models.Ticket.technician == technician)
    if category:
        query = query.filter(models.Ticket.category == category)

    return query.all()


# =========================
# PDF Export Endpoint
# =========================
@router.get("/reports/export/pdf")
def export_pdf_report(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    technician: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(database.get_db),
):
    """
    Generate and download a PDF report for all filtered tickets.
    """
    query = db.query(models.Ticket)

    # Filters
    if date_from:
        try:
            query = query.filter(models.Ticket.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass

    if date_to:
        try:
            query = query.filter(models.Ticket.created_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    if technician:
        query = query.filter(models.Ticket.technician == technician)
    if category:
        query = query.filter(models.Ticket.category == category)

    tickets = query.all()

    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
    elements = []
    styles = getSampleStyleSheet()
    title = Paragraph("NAITA ServiceDesk - Ticket Report", styles["Title"])
    elements.append(title)
    elements.append(Spacer(1, 12))

    data = [["Ticket No", "Summary", "Status", "Technician", "Category", "Branch", "Created", "Closed"]]

    for t in tickets:
        data.append([
            t.number or "N/A",
            t.summary or "",
            t.status or "",
            t.technician or "",
            t.category or "",
            getattr(t, "branch_name", "N/A"),
            t.created_at.strftime("%Y-%m-%d") if t.created_at else "",
            t.completed_at.strftime("%Y-%m-%d") if t.completed_at else "",
        ])

    table = Table(data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3B82F6")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    headers = {
        "Content-Disposition": 'attachment; filename="tickets_report.pdf"',
        "Content-Type": "application/pdf",
    }

    return Response(content=buffer.getvalue(), headers=headers, media_type="application/pdf")


# =========================
# CSV Export Endpoint (without pandas)
# =========================
@router.get("/reports/export/csv")
def export_csv_report(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    technician: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(database.get_db),
):
    """
    Generate and download a CSV report for all filtered tickets without pandas.
    """
    query = db.query(models.Ticket)

    # Apply filters
    if date_from:
        try:
            query = query.filter(models.Ticket.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass

    if date_to:
        try:
            query = query.filter(models.Ticket.created_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    if technician:
        query = query.filter(models.Ticket.technician == technician)
    if category:
        query = query.filter(models.Ticket.category == category)

    tickets = query.all()

    if not tickets:
        return Response("No tickets found.", media_type="text/plain")

    # Create CSV in memory
    output = StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["Ticket No", "Summary", "Status", "Technician", "Category", "Branch", "Created", "Closed"])

    # Rows
    for t in tickets:
        writer.writerow([
            t.number or "N/A",
            t.summary or "",
            t.status or "",
            t.technician or "",
            t.category or "",
            getattr(t, "branch_name", "N/A"),
            t.created_at.strftime("%Y-%m-%d") if t.created_at else "",
            t.completed_at.strftime("%Y-%m-%d") if t.completed_at else "",
        ])

    csv_data = output.getvalue()
    output.close()

    headers = {
        "Content-Disposition": 'attachment; filename="tickets_report.csv"',
        "Content-Type": "text/csv",
    }

    return Response(content=csv_data, headers=headers, media_type="text/csv")
