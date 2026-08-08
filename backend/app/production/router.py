from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_session
from ..auth import get_current_user
from ..models import User, RoleEnum
from .schemas import PTCreate, PTRead, PTUpdate, PTListResponse, CommentCreate, CommentRead, AssignmentCreate, StatusChangeRequest, TagCreate, DependencyCreate, WatcherCreate, TimelineEntry, AttachmentRead, AssignmentRead, HistoryEntry, AttachmentCreate, KarigarActionRequest
from .service import ProductionTicketService
from typing import Optional

router = APIRouter()

MANAGER_ROLES = {RoleEnum.owner, RoleEnum.admin, RoleEnum.production_manager, RoleEnum.office, RoleEnum.qc}

def can_manage_production(user: User) -> bool:
    return user.role in MANAGER_ROLES

async def require_ticket_access(svc: ProductionTicketService, ticket_id: str, user: User):
    if can_manage_production(user) or user.role == RoleEnum.karigar:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed to access this production ticket')

def require_manager(user: User):
    if not can_manage_production(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed for this role')

@router.post('/', response_model=PTRead, status_code=201)
async def create_pt(payload: PTCreate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    require_manager(current_user)
    svc = ProductionTicketService(session)
    try:
        print(f"[DEBUG] Creating ticket with payload: {payload}")
        pt = await svc.create_ticket(payload, created_by=str(current_user.id))
        print(f"[DEBUG] Ticket created: {pt.id}, {pt.ticket_number}")
        # return a plain dict to avoid pydantic orm/serialization issues
        result = {
            "id": str(pt.id),
            "ticket_number": pt.ticket_number,
            "title": pt.title,
            "description": pt.description,
            "status": pt.status,
            "priority": pt.priority,
            "category": pt.category,
            "expected_delivery": pt.expected_delivery,
            "parent_id": pt.parent_id,
            "tags": [],
            "created_at": pt.created_at,
            "updated_at": pt.updated_at,
        }
        print(f"[DEBUG] Response dict: {result}")
        return result
    except Exception as e:
        # print to stdout for debugging
        import traceback
        print(f"[ERROR] Exception in create_pt: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Internal Server Error')

@router.get('/', response_model=PTListResponse)
async def list_pts(limit: int = 25, offset: int = 0, search: Optional[str] = None, status: Optional[str] = None, category: Optional[str] = None, priority: Optional[str] = None, tag: Optional[str] = None, assignee_id: Optional[str] = None, sort_by: str = 'created_at', order: str = 'desc', session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    svc = ProductionTicketService(session)
    if current_user.role == RoleEnum.karigar:
        assignee_id = str(current_user.id)
    items, total = await svc.repo.list(limit=limit, offset=offset, search=search, status=status, category=category, priority=priority, tag=tag, assignee_id=assignee_id, sort_by=sort_by, order=order)
    return {"items": items, "total": total, "limit": limit, "offset": offset}

@router.get('/{ticket_id}', response_model=PTRead)
async def get_pt(ticket_id: str, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    svc = ProductionTicketService(session)
    await require_ticket_access(svc, ticket_id, current_user)
    pt = await svc.get_ticket(ticket_id)
    if not pt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='PT not found')
    return pt

@router.patch('/{ticket_id}', response_model=PTRead)
async def update_pt(ticket_id: str, payload: PTUpdate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    require_manager(current_user)
    svc = ProductionTicketService(session)
    try:
        updated = await svc.update_ticket(ticket_id, payload, updated_by=str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='PT not found')
    return updated

@router.delete('/{ticket_id}', status_code=204)
async def delete_pt(ticket_id: str, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    require_manager(current_user)
    svc = ProductionTicketService(session)
    await svc.repo.delete(ticket_id)
    return None

@router.post('/{ticket_id}/status', response_model=PTRead)
async def change_status(ticket_id: str, payload: StatusChangeRequest, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    require_manager(current_user)
    svc = ProductionTicketService(session)
    try:
        pt = await svc.change_status(ticket_id, payload, actor_id=str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if not pt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='PT not found')
    return pt

@router.post('/{ticket_id}/comments', response_model=CommentRead, status_code=201)
async def add_comment(ticket_id: str, payload: CommentCreate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    svc = ProductionTicketService(session)
    await require_ticket_access(svc, ticket_id, current_user)
    comment = await svc.add_comment(ticket_id, payload, author_id=str(current_user.id))
    return comment

@router.get('/{ticket_id}/comments', response_model=list[CommentRead])
async def list_comments(ticket_id: str, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    svc = ProductionTicketService(session)
    await require_ticket_access(svc, ticket_id, current_user)
    items = await svc.list_comments(ticket_id)
    return items

@router.post('/{ticket_id}/assignments', response_model=list[AssignmentRead], status_code=201)
async def assign(ticket_id: str, payload: AssignmentCreate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    require_manager(current_user)
    svc = ProductionTicketService(session)
    assigns = await svc.assign(ticket_id, payload, assigned_by=str(current_user.id))
    return assigns

@router.get('/{ticket_id}/assignments', response_model=list[AssignmentRead])
async def list_assignments(ticket_id: str, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    svc = ProductionTicketService(session)
    await require_ticket_access(svc, ticket_id, current_user)
    items = await svc.list_assignments(ticket_id)
    return items

@router.post('/{ticket_id}/attachments', response_model=AttachmentRead, status_code=201)
async def add_attachment(ticket_id: str, payload: AttachmentCreate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    svc = ProductionTicketService(session)
    await require_ticket_access(svc, ticket_id, current_user)
    att = await svc.add_attachment(ticket_id, payload.filename, payload.url, uploader_id=str(current_user.id))
    return att

@router.get('/{ticket_id}/attachments', response_model=list[AttachmentRead])
async def list_attachments(ticket_id: str, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    svc = ProductionTicketService(session)
    await require_ticket_access(svc, ticket_id, current_user)
    items = await svc.list_attachments(ticket_id)
    return items

@router.post('/{ticket_id}/tags', status_code=201)
async def add_tag(ticket_id: str, payload: TagCreate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    require_manager(current_user)
    svc = ProductionTicketService(session)
    t = await svc.add_tag(ticket_id, payload.name)
    return {"id": str(t.id), "name": t.name}

@router.delete('/{ticket_id}/tags')
async def remove_tag(ticket_id: str, name: str, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    require_manager(current_user)
    svc = ProductionTicketService(session)
    await svc.remove_tag(ticket_id, name)
    return {"ok": True}

@router.post('/{ticket_id}/watchers', status_code=201)
async def add_watcher(ticket_id: str, payload: WatcherCreate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    require_manager(current_user)
    svc = ProductionTicketService(session)
    w = await svc.add_watcher(ticket_id, payload.user_id)
    return {"id": str(w.id)}

@router.delete('/{ticket_id}/watchers')
async def remove_watcher(ticket_id: str, user_id: str, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    require_manager(current_user)
    svc = ProductionTicketService(session)
    await svc.remove_watcher(ticket_id, user_id)
    return {"ok": True}

@router.post('/{ticket_id}/dependencies', status_code=201)
async def add_dependency(ticket_id: str, payload: DependencyCreate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    require_manager(current_user)
    svc = ProductionTicketService(session)
    d = await svc.add_dependency(ticket_id, payload.depends_on_id)
    return {"id": str(d.id)}

@router.get('/{ticket_id}/timeline', response_model=list[TimelineEntry])
async def get_timeline(ticket_id: str, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    svc = ProductionTicketService(session)
    await require_ticket_access(svc, ticket_id, current_user)
    items = await svc.list_timeline(ticket_id)
    return items

@router.get('/{ticket_id}/history', response_model=list[HistoryEntry])
async def get_history(ticket_id: str, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    svc = ProductionTicketService(session)
    await require_ticket_access(svc, ticket_id, current_user)
    items = await svc.list_history(ticket_id)
    return items

@router.post('/{ticket_id}/accept', response_model=PTRead)
async def accept_ticket(ticket_id: str, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.karigar:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only karigars can accept assigned work')
    svc = ProductionTicketService(session)
    pt = await svc.accept_assignment(ticket_id, str(current_user.id))
    if not pt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Assigned ticket not found')
    return pt

@router.post('/{ticket_id}/reject', response_model=PTRead)
async def reject_ticket(ticket_id: str, payload: KarigarActionRequest = KarigarActionRequest(), session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.karigar:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only karigars can reject assigned work')
    svc = ProductionTicketService(session)
    pt = await svc.reject_assignment(ticket_id, str(current_user.id), reason=payload.reason)
    if not pt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Assigned ticket not found')
    return pt

@router.post('/{ticket_id}/start-work', response_model=PTRead)
async def start_work(ticket_id: str, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.karigar:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only karigars can start assigned work')
    svc = ProductionTicketService(session)
    pt = await svc.start_work(ticket_id, str(current_user.id))
    if not pt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Assigned ticket not found')
    return pt

@router.post('/{ticket_id}/complete-work', response_model=PTRead)
async def complete_work(ticket_id: str, payload: KarigarActionRequest = KarigarActionRequest(), session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.karigar:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only karigars can complete assigned work')
    svc = ProductionTicketService(session)
    pt = await svc.complete_work(ticket_id, str(current_user.id), note=payload.note)
    if not pt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Assigned ticket not found')
    return pt

@router.post('/{ticket_id}/ping', status_code=200)
async def ping_karigar(ticket_id: str, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Owner pings a karigar to update the ticket. Records a timeline entry."""
    require_manager(current_user)
    svc = ProductionTicketService(session)
    pt = await svc.get_ticket(ticket_id)
    if not pt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='PT not found')
    from .models import TicketTimeline, TicketActivity
    from datetime import datetime
    tl = TicketTimeline(ticket_id=ticket_id, event_type='owner_ping', actor_id=str(current_user.id), data='Owner pinged karigar for update')
    ac = TicketActivity(ticket_id=ticket_id, activity_type='owner_ping', actor_id=str(current_user.id), details='Owner pinged karigar for update')
    svc.session.add(tl)
    svc.session.add(ac)
    await svc.session.commit()
    return {"ok": True, "message": "Ping recorded"}

