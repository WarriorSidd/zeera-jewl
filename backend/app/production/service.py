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
    'Production': ['Stone Setting', 'Accepted'],
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
        pt = ProductionTicket(ticket_number=ticket_num, title=payload.title, description=payload.description, expected_delivery=payload.expected_delivery, priority=payload.priority, category=payload.category, parent_id=payload.parent_id, created_by_id=created_by)
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
        # Validate transition
        allowed = ALLOWED_TRANSITIONS.get(old_status, [])
        if new_status not in allowed:
            raise ValueError(f"Invalid status transition: {old_status} -> {new_status}")
        await self.repo.update(ticket_id, status=new_status, updated_at=datetime.utcnow())
        # create timeline, activity, history
        await self.timeline_repo.create(TicketTimeline(ticket_id=ticket_id, event_type='status_change', actor_id=actor_id, data=f'{old_status} -> {new_status}; reason: {payload.reason}'))
        await self.activity_repo.create(TicketActivity(ticket_id=ticket_id, activity_type='status_change', actor_id=actor_id, details=f'{old_status} -> {new_status}'))
        await self.history_repo.create(TicketHistory(ticket_id=ticket_id, change_type='status_change', old_value=old_status, new_value=new_status, reason=payload.reason, changed_by=actor_id))
        # placeholder notification: in real implementation, NotificationService publishes event
        return await self.repo.get(ticket_id)

    async def add_comment(self, ticket_id: str, payload: CommentCreate, author_id: Optional[str] = None):
        comment = TicketComment(ticket_id=ticket_id, author_id=author_id, content=payload.content)
        created = await self.comment_repo.create(comment)
        # attachments
        if payload.attachments:
            for a in payload.attachments:
                await self.attachment_repo.create(TicketAttachment(ticket_id=ticket_id, uploader_id=author_id, comment_id=created.id, filename=a.get('filename'), url=a.get('url'), mime_type=a.get('mime_type')))
        await self.timeline_repo.create(TicketTimeline(ticket_id=ticket_id, event_type='comment_created', actor_id=author_id, data=payload.content))
        await self.activity_repo.create(TicketActivity(ticket_id=ticket_id, activity_type='comment', actor_id=author_id, details=payload.content))
        return created

    async def assign(self, ticket_id: str, payload: AssignmentCreate, assigned_by: Optional[str] = None):
        created_items = []
        for aid in payload.assignee_ids:
            assign = TicketAssignment(ticket_id=ticket_id, assignee_id=aid, assigned_by=assigned_by)
            created = await self.assign_repo.create(assign)
            created_items.append(created)
            await self.timeline_repo.create(TicketTimeline(ticket_id=ticket_id, event_type='assigned', actor_id=assigned_by, data=str(aid)))
            await self.activity_repo.create(TicketActivity(ticket_id=ticket_id, activity_type='assign', actor_id=assigned_by, details=str(aid)))
            await self.history_repo.create(TicketHistory(ticket_id=ticket_id, change_type='assignment', old_value=None, new_value=str(aid), changed_by=assigned_by))
        return created_items

    async def add_attachment(self, ticket_id: str, filename: str, url: str, uploader_id: Optional[str] = None):
        att = TicketAttachment(ticket_id=ticket_id, uploader_id=uploader_id, filename=filename, url=url)
        created = await self.attachment_repo.create(att)
        await self.timeline_repo.create(TicketTimeline(ticket_id=ticket_id, event_type='attachment_added', actor_id=uploader_id, data=filename))
        await self.activity_repo.create(TicketActivity(ticket_id=ticket_id, activity_type='attachment', actor_id=uploader_id, details=filename))
        return created

    # tags
    async def add_tag(self, ticket_id: str, name: str):
        return await self.repo.add_tag(ticket_id, name)

    async def remove_tag(self, ticket_id: str, name: str):
        return await self.repo.remove_tag(ticket_id, name)

    # watchers
    async def add_watcher(self, ticket_id: str, user_id: str):
        return await self.repo.add_watcher(ticket_id, user_id)

    async def remove_watcher(self, ticket_id: str, user_id: str):
        return await self.repo.remove_watcher(ticket_id, user_id)

    # dependencies
    async def add_dependency(self, ticket_id: str, depends_on_id: str):
        return await self.repo.add_dependency(ticket_id, depends_on_id)

    async def list_timeline(self, ticket_id: str):
        return await self.timeline_repo.list(ticket_id)

    async def list_comments(self, ticket_id: str):
        return await self.comment_repo.list(ticket_id)

    async def list_attachments(self, ticket_id: str):
        return await self.attachment_repo.list(ticket_id)

    async def list_history(self, ticket_id: str):
        return await self.history_repo.list(ticket_id)

    async def list_assignments(self, ticket_id: str):
        return await self.assign_repo.list(ticket_id)

    async def list_activity(self, ticket_id: str):
        return await self.activity_repo.list(ticket_id)

    async def list_tags(self, ticket_id: str):
        return await self.repo.list_tags(ticket_id)

    async def list_watchers(self, ticket_id: str):
        return await self.repo.list_watchers(ticket_id)

    async def list_dependencies(self, ticket_id: str):
        return await self.repo.list_dependencies(ticket_id)
