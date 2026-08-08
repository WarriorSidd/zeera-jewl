from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from .repository import ProductionTicketRepository, CommentRepository, AssignmentRepository, TimelineRepository, HistoryRepository, ActivityRepository, AttachmentRepository
from .models import ProductionTicket, TicketComment, TicketAssignment, TicketTimeline, TicketHistory, TicketActivity, TicketAttachment, TicketTag, TicketWatcher, TicketDependency
from .schemas import PTCreate, PTUpdate, CommentCreate, AssignmentCreate, StatusChangeRequest, TagCreate, DependencyCreate, WatcherCreate
from uuid import uuid4
from datetime import datetime

# Allowed workflow transitions
ALLOWED_TRANSITIONS = {
    'Draft': ['Review'],
    'Review': ['Assigned', 'Draft'],
    'Assigned': ['Accepted', 'Review'],
    'Accepted': ['Production', 'Assigned'],
    'Production': ['Stone Setting', 'Quality Check', 'Accepted'],
    'Stone Setting': ['Polishing'],
    'Polishing': ['Quality Check'],
    'Quality Check': ['Ready', 'Production'],
    'Ready': ['Delivered'],
    'Delivered': ['Closed'],
    'Closed': ['Archived'],
    'Archived': []
}


class ProductionTicketService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = ProductionTicketRepository(session)
        self.comment_repo = CommentRepository(session)
        self.assign_repo = AssignmentRepository(session)
        self.timeline_repo = TimelineRepository(session)
        self.history_repo = HistoryRepository(session)
        self.activity_repo = ActivityRepository(session)
        self.attachment_repo = AttachmentRepository(session)

    async def create_ticket(self, payload: PTCreate, created_by: Optional[str] = None) -> ProductionTicket:
        # generate ticket number: PT-YYYY-xxxxx
        ticket_num = f"PT-{datetime.utcnow().year}-{str(uuid4())[:8].upper()}"
        exp_del = payload.expected_delivery
        if exp_del and exp_del.tzinfo is not None:
            exp_del = exp_del.replace(tzinfo=None)
        pt = ProductionTicket(
            ticket_number=ticket_num,
            title=payload.title,
            description=payload.description,
            expected_delivery=exp_del,
            priority=payload.priority,
            category=payload.category,
            parent_id=payload.parent_id,
            created_by_id=created_by
        )
        created = await self.repo.create(pt)
        # tags
        if payload.tags:
            for t in payload.tags:
                await self.repo.add_tag(created.id, t)
        # create timeline, activity, history
        await self.timeline_repo.create(TicketTimeline(ticket_id=created.id, event_type='created', actor_id=created_by, data=f'Created PT {created.ticket_number}'))
        await self.activity_repo.create(TicketActivity(ticket_id=created.id, activity_type='create', actor_id=created_by, details='Ticket created'))
        await self.history_repo.create(TicketHistory(ticket_id=created.id, change_type='create', old_value=None, new_value=str({'status': created.status}), changed_by=created_by))
        return created

    async def get_ticket(self, ticket_id: str) -> Optional[ProductionTicket]:
        return await self.repo.get(ticket_id)

    async def update_ticket(self, ticket_id: str, payload: PTUpdate, updated_by: Optional[str] = None):
        current = await self.repo.get(ticket_id)
        if not current:
            return None
        old = {"title": current.title, "description": current.description, "expected_delivery": str(current.expected_delivery), "priority": current.priority, "category": current.category}
        fields = payload.dict(exclude_unset=True)

        if 'expected_delivery' in fields and fields['expected_delivery']:
            dt = fields['expected_delivery']
            if isinstance(dt, datetime) and dt.tzinfo is not None:
                fields['expected_delivery'] = dt.replace(tzinfo=None)

        # status change via dedicated method
        if 'status' in fields:
            # defer to change_status to validate transitions
            status_payload = StatusChangeRequest(new_status=fields.pop('status'))
            await self.change_status(ticket_id, status_payload, actor_id=updated_by)
        if fields:
            await self.repo.update(ticket_id, **fields)
            await self.timeline_repo.create(TicketTimeline(ticket_id=ticket_id, event_type='updated', actor_id=updated_by, data=f'Updated fields: {list(fields.keys())}'))
            await self.activity_repo.create(TicketActivity(ticket_id=ticket_id, activity_type='update', actor_id=updated_by, details=f'Updated fields: {list(fields.keys())}'))
            await self.history_repo.create(TicketHistory(ticket_id=ticket_id, change_type='update', old_value=str(old), new_value=str(fields), changed_by=updated_by))
        return await self.repo.get(ticket_id)

    async def change_status(self, ticket_id: str, payload: StatusChangeRequest, actor_id: Optional[str] = None):
        current = await self.repo.get(ticket_id)
        if not current:
            return None
        old_status = current.status
        new_status = payload.new_status

        # Update status
        await self.repo.update_status(ticket_id, new_status)
        await self.timeline_repo.create(TicketTimeline(ticket_id=ticket_id, event_type='status_change', actor_id=actor_id, data=f'{old_status} -> {new_status}; reason: {payload.reason or "No reason provided"}'))
        await self.activity_repo.create(TicketActivity(ticket_id=ticket_id, activity_type='status_change', actor_id=actor_id, details=f'Status changed from {old_status} to {new_status}'))
        await self.history_repo.create(TicketHistory(ticket_id=ticket_id, change_type='status_change', old_value=old_status, new_value=new_status, reason=payload.reason, changed_by=actor_id))
        return await self.repo.get(ticket_id)

    async def list_timeline(self, ticket_id: str):
        return await self.repo.list_timeline(ticket_id)

    async def list_history(self, ticket_id: str):
        return await self.repo.list_history(ticket_id)

    async def assign_karigar(self, ticket_id: str, payload: AssignmentCreate, assigned_by: Optional[str] = None):
        pt = await self.repo.get(ticket_id)
        if not pt:
            return None
        res = await self.assign_repo.assign(ticket_id, payload.assignee_ids, assigned_by=assigned_by)
        for uid in payload.assignee_ids:
            await self.timeline_repo.create(TicketTimeline(ticket_id=ticket_id, event_type='assigned', actor_id=assigned_by, data=str(uid)))
            await self.activity_repo.create(TicketActivity(ticket_id=ticket_id, activity_type='assigned', actor_id=assigned_by, details=f'Assigned user {uid}'))
            await self.history_repo.create(TicketHistory(ticket_id=ticket_id, change_type='assignment', old_value=None, new_value=str(uid), changed_by=assigned_by))

        # Auto-advance Draft -> Review -> Assigned
        if pt.status in ['Draft', 'Review']:
            if pt.status == 'Draft':
                await self.change_status(ticket_id, StatusChangeRequest(new_status='Review', reason='Moved to review before assignment'), actor_id=assigned_by)
            await self.change_status(ticket_id, StatusChangeRequest(new_status='Assigned', reason='Karigar assigned'), actor_id=assigned_by)

        return res

    async def karigar_accept(self, ticket_id: str, karigar_id: str, note: Optional[str] = None):
        pt = await self.repo.get(ticket_id)
        if not pt:
            raise ValueError("Ticket not found")
        await self.assign_repo.accept(ticket_id, karigar_id)
        await self.timeline_repo.create(TicketTimeline(ticket_id=ticket_id, event_type='karigar_accepted', actor_id=karigar_id, data=note or 'Accepted assigned work'))
        if pt.status == 'Assigned':
            await self.change_status(ticket_id, StatusChangeRequest(new_status='Accepted', reason=note or 'Karigar accepted work'), actor_id=karigar_id)
        return await self.repo.get(ticket_id)

    async def karigar_reject(self, ticket_id: str, karigar_id: str, reason: Optional[str] = None):
        pt = await self.repo.get(ticket_id)
        if not pt:
            raise ValueError("Ticket not found")
        await self.timeline_repo.create(TicketTimeline(ticket_id=ticket_id, event_type='karigar_rejected', actor_id=karigar_id, data=reason or 'Rejected assigned work'))
        await self.history_repo.create(TicketHistory(ticket_id=ticket_id, change_type='karigar_rejected', old_value=pt.status, new_value='Rejected', reason=reason, changed_by=karigar_id))
        return pt

    async def karigar_start_work(self, ticket_id: str, karigar_id: str, note: Optional[str] = None):
        pt = await self.repo.get(ticket_id)
        if not pt:
            raise ValueError("Ticket not found")
        if pt.status == 'Accepted':
            await self.change_status(ticket_id, StatusChangeRequest(new_status='Production', reason=note or 'Karigar started work'), actor_id=karigar_id)
        return await self.repo.get(ticket_id)

    async def karigar_complete_work(self, ticket_id: str, karigar_id: str, note: Optional[str] = None):
        pt = await self.repo.get(ticket_id)
        if not pt:
            raise ValueError("Ticket not found")
        if pt.status == 'Production':
            await self.change_status(ticket_id, StatusChangeRequest(new_status='Quality Check', reason=note or 'Karigar completed work'), actor_id=karigar_id)
        return await self.repo.get(ticket_id)

    async def owner_ping(self, ticket_id: str, owner_id: str):
        pt = await self.repo.get(ticket_id)
        if not pt:
            raise ValueError("Ticket not found")
        await self.timeline_repo.create(TicketTimeline(ticket_id=ticket_id, event_type='owner_ping', actor_id=owner_id, data='Owner pinged karigar for status update'))
        await self.activity_repo.create(TicketActivity(ticket_id=ticket_id, activity_type='ping', actor_id=owner_id, details='Ping sent to karigar'))
        return pt

    # Router compatibility aliases
    async def assign(self, ticket_id: str, payload: AssignmentCreate, assigned_by: Optional[str] = None):
        return await self.assign_karigar(ticket_id, payload, assigned_by=assigned_by)

    async def accept_assignment(self, ticket_id: str, karigar_id: str, note: Optional[str] = None):
        return await self.karigar_accept(ticket_id, karigar_id, note=note)

    async def reject_assignment(self, ticket_id: str, karigar_id: str, reason: Optional[str] = None):
        return await self.karigar_reject(ticket_id, karigar_id, reason=reason)

    async def start_work(self, ticket_id: str, karigar_id: str, note: Optional[str] = None):
        return await self.karigar_start_work(ticket_id, karigar_id, note=note)

    async def complete_work(self, ticket_id: str, karigar_id: str, note: Optional[str] = None):
        return await self.karigar_complete_work(ticket_id, karigar_id, note=note)
