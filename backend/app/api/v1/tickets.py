from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import io, csv

from app import models, database
from app.auth import get_current_user

router = APIRouter(
    prefix="/tickets",
    tags=["tickets"]
)

# ----------------------------
# Pydantic Schemas
# ----------------------------
class TicketStatusUpdate(BaseModel):
    status: str  # "IN_PROGRESS" or "COMPLETED"

class TicketOut(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    created_at: datetime
    branch: Optional[str]
    assigned_to_id: Optional[int]
    class Config:
        orm_mode = True
class NotificationOut(BaseModel):
    id: int
    ticket_id: int
    message: str
    read: bool
    created_at: datetime

    class Config:
        orm_mode = True

# ----------------------------
# Admin-only: Get all tickets
# ----------------------------
@router.get("/", response_model=List[TicketOut])
def get_tickets(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    technician: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    created_from: Optional[date] = Query(None),
    created_to: Optional[date] = Query(None),
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user),
):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    query = db.query(models.Ticket)

    if status:
        query = query.filter(models.Ticket.status == status)
    if priority:
        query = query.filter(models.Ticket.priority == priority)
    if branch:
        query = query.filter(models.Ticket.branch == branch)
    if technician:
        query = query.filter(models.Ticket.assigned_to_id == technician)
    if search:
        query = query.filter(models.Ticket.title.ilike(f"%{search}%"))
    if created_from:
        query = query.filter(models.Ticket.created_at >= datetime.combine(created_from, datetime.min.time()))
    if created_to:
        query = query.filter(models.Ticket.created_at <= datetime.combine(created_to, datetime.max.time()))

    tickets = query.order_by(models.Ticket.created_at.desc()).all()
    return tickets or []

# ----------------------------
# Recent tickets
# ----------------------------
@router.get("/recent", response_model=List[TicketOut])
def get_recent_tickets(
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user),
):
    tickets = db.query(models.Ticket).order_by(models.Ticket.created_at.desc()).limit(5).all()
    return tickets or []

# ----------------------------
# Technician-only: Assigned tickets
# ----------------------------
@router.get("/assigned", response_model=List[TicketOut])
def get_assigned_tickets(
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user),
):
    if current_user.role.lower() != "technician":
        raise HTTPException(status_code=403, detail="Forbidden")

    tickets = (
        db.query(models.Ticket)
        .filter(models.Ticket.assigned_to_id == current_user.id)
        .order_by(models.Ticket.created_at.desc())
        .all()
    )
    return tickets or []

# ----------------------------
# Technician-only: Update ticket status
# ----------------------------
@router.patch("/{ticket_id}/status")
def update_ticket_status(
    ticket_id: int = Path(..., description="ID of the ticket to update"),
    payload: TicketStatusUpdate = Depends(),
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user),
):
    if current_user.role.lower() != "technician":
        raise HTTPException(status_code=403, detail="Forbidden")

    ticket = (
        db.query(models.Ticket)
        .filter(models.Ticket.id == ticket_id, models.Ticket.assigned_to_id == current_user.id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if payload.status not in ["IN_PROGRESS", "COMPLETED"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    ticket.status = payload.status
    db.commit()
    db.refresh(ticket)
    return {"message": "Status updated", "ticketId": ticket.id, "newStatus": ticket.status}

# ----------------------------
# Notifications
# ----------------------------
@router.get("/notifications", response_model=List[NotificationOut])
def get_notifications(
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user),
):
    notifications = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )
    return notifications or []

# ----------------------------
# Admin-only: Ticket stats (filters + CSV export)
# ----------------------------
@router.get("/stats")
def ticket_stats(
    created_from: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    created_to: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    export: Optional[bool] = Query(False, description="Export as CSV"),
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user),
):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        # Parse dates safely
        from_dt = datetime.strptime(created_from, "%Y-%m-%d") if created_from else None
        to_dt = datetime.strptime(created_to, "%Y-%m-%d") if created_to else None

        query = db.query(models.Ticket)
        if from_dt:
            query = query.filter(models.Ticket.created_at >= datetime.combine(from_dt.date(), datetime.min.time()))
        if to_dt:
            query = query.filter(models.Ticket.created_at <= datetime.combine(to_dt.date(), datetime.max.time()))

        # Tickets by status
        by_status = query.with_entities(models.Ticket.status, func.count(models.Ticket.id)) \
                         .group_by(models.Ticket.status).all()
        by_status_list = [{"status": status or "Unknown", "count": count} for status, count in by_status]

        # Tickets by priority
        by_priority = query.with_entities(models.Ticket.priority, func.count(models.Ticket.id)) \
                           .group_by(models.Ticket.priority).all()
        by_priority_list = [{"priority": priority or "Unknown", "count": count} for priority, count in by_priority]

        # Tickets by branch
        by_branch = query.with_entities(models.Ticket.branch, func.count(models.Ticket.id)) \
                         .group_by(models.Ticket.branch).all()
        by_branch_list = [{"branch_name": branch or "Unknown", "count": count} for branch, count in by_branch]

        # Tickets by technician (outer join for unassigned)
        query_tech = db.query(models.User.username, func.count(models.Ticket.id)) \
                       .outerjoin(models.Ticket, models.Ticket.assigned_to_id == models.User.id)
        if from_dt:
            query_tech = query_tech.filter(models.Ticket.created_at >= datetime.combine(from_dt.date(), datetime.min.time()))
        if to_dt:
            query_tech = query_tech.filter(models.Ticket.created_at <= datetime.combine(to_dt.date(), datetime.max.time()))
        by_technician = query_tech.group_by(models.User.username).all()
        by_technician_list = [{"username": username or "Unassigned", "count": count} for username, count in by_technician]

        # CSV export
        if export:
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Category", "Name", "Count"])
            for s in by_status_list:
                writer.writerow(["Status", s["status"], s["count"]])
            for p in by_priority_list:
                writer.writerow(["Priority", p["priority"], p["count"]])
            for b in by_branch_list:
                writer.writerow(["Branch", b["branch_name"], b["count"]])
            for t in by_technician_list:
                writer.writerow(["Technician", t["username"], t["count"]])
            output.seek(0)
            return StreamingResponse(
                output,
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=ticket_stats.csv"},
            )

        return {
            "by_status": by_status_list,
            "by_priority": by_priority_list,
            "by_branch": by_branch_list,
            "by_technician": by_technician_list,
        }

    except Exception as e:
        print("ERROR in /tickets/stats:", e)
        raise HTTPException(status_code=500, detail="Failed to generate ticket stats")
