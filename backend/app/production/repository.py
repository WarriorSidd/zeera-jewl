from typing import Optional, List, Tuple
from sqlalchemy import select, update, delete, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from .models import ProductionTicket, TicketComment, TicketAssignment, TicketTimeline, TicketHistory, TicketActivity, TicketAttachment, TicketTag, TicketWatcher, TicketDependency
from uuid import UUID

class ProductionTicketRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, ticket: ProductionTicket) -> ProductionTicket:
        self.session.add(ticket)
        await self.session.commit()
        await self.session.refresh(ticket)
        return ticket

    async def get(self, ticket_id: UUID) -> Optional[ProductionTicket]:
        q = await self.session.execute(select(ProductionTicket).where(ProductionTicket.id == ticket_id))
        return q.scalars().first()

    async def get_by_number(self, ticket_number: str) -> Optional[ProductionTicket]:
        q = await self.session.execute(select(ProductionTicket).where(ProductionTicket.ticket_number == ticket_number))
        return q.scalars().first()

    async def update(self, ticket_id: UUID, **fields) -> Optional[ProductionTicket]:
        await self.session.execute(update(ProductionTicket).where(ProductionTicket.id == ticket_id).values(**fields))
        await self.session.commit()
        return await self.get(ticket_id)

    async def delete(self, ticket_id: UUID):
        await self.session.execute(delete(ProductionTicket).where(ProductionTicket.id == ticket_id))
        await self.session.commit()

    async def list(self, limit: int = 25, offset: int = 0, search: Optional[str] = None, status: Optional[str] = None, category: Optional[str] = None, priority: Optional[str] = None, tag: Optional[str] = None, assignee_id: Optional[UUID] = None, sort_by: str = 'created_at', order: str = 'desc') -> Tuple[List[ProductionTicket], int]:
        q = select(ProductionTicket)
        if search:
            s = f"%{search}%"
            q = q.where(or_(ProductionTicket.ticket_number.ilike(s), ProductionTicket.title.ilike(s), ProductionTicket.description.ilike(s)))
        if status:
            q = q.where(ProductionTicket.status == status)
        if category:
            q = q.where(ProductionTicket.category == category)
        if priority:
            q = q.where(ProductionTicket.priority == priority)
        if tag:
            # join via ticket_tags
            q = q.where(ProductionTicket.id.in_(select(TicketTag.ticket_id).where(TicketTag.name == tag)))
        if assignee_id:
            q = q.where(ProductionTicket.id.in_(select(TicketAssignment.ticket_id).where(TicketAssignment.assignee_id == assignee_id)))
        total_q = select(func.count()).select_from(q.subquery())
        q = q.order_by(getattr(getattr(ProductionTicket, sort_by), order)()).limit(limit).offset(offset)
        res = await self.session.execute(q)
        items = res.scalars().all()
        total_res = await self.session.execute(total_q)
        total = total_res.scalar_one()
        return items, total

    # tags
    async def add_tag(self, ticket_id: UUID, name: str):
        t = TicketTag(ticket_id=ticket_id, name=name)
        self.session.add(t)
        await self.session.commit()
        await self.session.refresh(t)
        return t

    async def remove_tag(self, ticket_id: UUID, name: str):
        await self.session.execute(delete(TicketTag).where(TicketTag.ticket_id == ticket_id).where(TicketTag.name == name))
        await self.session.commit()

    async def list_tags(self, ticket_id: UUID):
        q = await self.session.execute(select(TicketTag).where(TicketTag.ticket_id == ticket_id))
        return q.scalars().all()

    # watchers
    async def add_watcher(self, ticket_id: UUID, user_id: UUID):
        w = TicketWatcher(ticket_id=ticket_id, user_id=user_id)
        self.session.add(w)
        await self.session.commit()
        await self.session.refresh(w)
        return w

    async def remove_watcher(self, ticket_id: UUID, user_id: UUID):
        await self.session.execute(delete(TicketWatcher).where(TicketWatcher.ticket_id == ticket_id).where(TicketWatcher.user_id == user_id))
        await self.session.commit()

    async def list_watchers(self, ticket_id: UUID):
        q = await self.session.execute(select(TicketWatcher).where(TicketWatcher.ticket_id == ticket_id))
        return q.scalars().all()

    # dependencies
    async def add_dependency(self, ticket_id: UUID, depends_on_id: UUID):
        d = TicketDependency(ticket_id=ticket_id, depends_on_id=depends_on_id)
        self.session.add(d)
        await self.session.commit()
        await self.session.refresh(d)
        return d

    async def list_dependencies(self, ticket_id: UUID):
        q = await self.session.execute(select(TicketDependency).where(TicketDependency.ticket_id == ticket_id))
        return q.scalars().all()

class CommentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, comment: TicketComment) -> TicketComment:
        self.session.add(comment)
        await self.session.commit()
        await self.session.refresh(comment)
        return comment

    async def list(self, ticket_id: UUID):
        q = await self.session.execute(select(TicketComment).where(TicketComment.ticket_id == ticket_id).order_by(TicketComment.created_at))
        return q.scalars().all()

class AssignmentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, assignment: TicketAssignment) -> TicketAssignment:
        self.session.add(assignment)
        await self.session.commit()
        await self.session.refresh(assignment)
        return assignment

    async def list(self, ticket_id: UUID):
        q = await self.session.execute(select(TicketAssignment).where(TicketAssignment.ticket_id == ticket_id).order_by(TicketAssignment.created_at))
        return q.scalars().all()

class TimelineRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, entry: TicketTimeline) -> TicketTimeline:
        self.session.add(entry)
        await self.session.commit()
        await self.session.refresh(entry)
        return entry

    async def list(self, ticket_id: UUID):
        q = await self.session.execute(select(TicketTimeline).where(TicketTimeline.ticket_id == ticket_id).order_by(TicketTimeline.created_at))
        return q.scalars().all()

class HistoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, h: TicketHistory) -> TicketHistory:
        self.session.add(h)
        await self.session.commit()
        await self.session.refresh(h)
        return h

    async def list(self, ticket_id: UUID):
        q = await self.session.execute(select(TicketHistory).where(TicketHistory.ticket_id == ticket_id).order_by(TicketHistory.created_at))
        return q.scalars().all()

class ActivityRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, a: TicketActivity) -> TicketActivity:
        self.session.add(a)
        await self.session.commit()
        await self.session.refresh(a)
        return a

    async def list(self, ticket_id: UUID):
        q = await self.session.execute(select(TicketActivity).where(TicketActivity.ticket_id == ticket_id).order_by(TicketActivity.created_at))
        return q.scalars().all()

class AttachmentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, att: TicketAttachment) -> TicketAttachment:
        self.session.add(att)
        await self.session.commit()
        await self.session.refresh(att)
        return att

    async def list(self, ticket_id: UUID):
        q = await self.session.execute(select(TicketAttachment).where(TicketAttachment.ticket_id == ticket_id).order_by(TicketAttachment.created_at))
        return q.scalars().all()
