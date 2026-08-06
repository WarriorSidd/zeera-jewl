from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text, Integer
import uuid
from datetime import datetime
from ..database import Base

class TicketStatus(Base):
    __tablename__ = 'ticket_statuses'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)

class TicketPriority(Base):
    __tablename__ = 'ticket_priorities'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)

class TicketCategory(Base):
    __tablename__ = 'ticket_categories'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)

class ProductionTicket(Base):
    __tablename__ = 'production_tickets'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_number = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default='Draft')
    priority = Column(String, nullable=True)
    category = Column(String, nullable=True)
    expected_delivery = Column(DateTime, nullable=True)
    custom_data = Column(Text, nullable=True)
    parent_id = Column(String(36), ForeignKey('production_tickets.id'), nullable=True)
    created_by_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class TicketHistory(Base):
    __tablename__ = 'ticket_history'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey('production_tickets.id'), nullable=False)
    changed_by = Column(String(36), nullable=True)
    change_type = Column(String, nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class TicketTimeline(Base):
    __tablename__ = 'ticket_timeline'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey('production_tickets.id'), nullable=False)
    event_type = Column(String, nullable=False)
    actor_id = Column(String(36), nullable=True)
    data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class TicketComment(Base):
    __tablename__ = 'ticket_comments'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey('production_tickets.id'), nullable=False)
    author_id = Column(String(36), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class TicketAttachment(Base):
    __tablename__ = 'ticket_attachments'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey('production_tickets.id'), nullable=False)
    uploader_id = Column(String(36), nullable=True)
    comment_id = Column(String(36), ForeignKey('ticket_comments.id'), nullable=True)
    filename = Column(String, nullable=False)
    url = Column(String, nullable=False)
    mime_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class TicketAssignment(Base):
    __tablename__ = 'ticket_assignments'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey('production_tickets.id'), nullable=False)
    assignee_id = Column(String(36), nullable=False)
    assigned_by = Column(String(36), nullable=True)
    accepted = Column(Boolean, default=False)
    accepted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class TicketWatcher(Base):
    __tablename__ = 'ticket_watchers'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey('production_tickets.id'), nullable=False)
    user_id = Column(String(36), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class TicketTag(Base):
    __tablename__ = 'ticket_tags'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey('production_tickets.id'), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class TicketDependency(Base):
    __tablename__ = 'ticket_dependencies'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey('production_tickets.id'), nullable=False)
    depends_on_id = Column(String(36), ForeignKey('production_tickets.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class TicketActivity(Base):
    __tablename__ = 'ticket_activities'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey('production_tickets.id'), nullable=False)
    activity_type = Column(String, nullable=False)
    actor_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
