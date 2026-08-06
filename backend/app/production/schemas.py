from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PTCreate(BaseModel):
    title: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    expected_delivery: Optional[datetime] = Field(default=None)
    priority: Optional[str] = Field(default=None)
    category: Optional[str] = Field(default=None)
    parent_id: Optional[str] = Field(default=None)
    tags: Optional[List[str]] = Field(default_factory=list)

class PTUpdate(BaseModel):
    title: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    expected_delivery: Optional[datetime] = Field(default=None)
    priority: Optional[str] = Field(default=None)
    category: Optional[str] = Field(default=None)
    status: Optional[str] = Field(default=None)

class PTRead(BaseModel):
    id: str
    ticket_number: str
    title: Optional[str]
    description: Optional[str]
    status: str
    priority: Optional[str]
    category: Optional[str]
    expected_delivery: Optional[datetime]
    parent_id: Optional[str]
    tags: Optional[List[str]] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True

class CommentCreate(BaseModel):
    content: str
    attachments: Optional[List[dict]] = Field(default_factory=list)

class CommentRead(BaseModel):
    id: str
    ticket_id: str
    author_id: Optional[str]
    content: str
    attachments: Optional[List[dict]] = []
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True

class AssignmentCreate(BaseModel):
    assignee_ids: List[str]

class AssignmentRead(BaseModel):
    id: str
    ticket_id: str
    assignee_id: str
    assigned_by: Optional[str]
    accepted: bool
    accepted_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True

class StatusChangeRequest(BaseModel):
    new_status: str
    reason: Optional[str] = Field(default=None)

class TagCreate(BaseModel):
    name: str

class DependencyCreate(BaseModel):
    depends_on_id: str

class WatcherCreate(BaseModel):
    user_id: str

class PTListResponse(BaseModel):
    items: List[PTRead]
    total: int
    limit: int
    offset: int

class TimelineEntry(BaseModel):
    id: str
    ticket_id: str
    event_type: str
    actor_id: Optional[str]
    data: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True

class ActivityEntry(BaseModel):
    id: str
    ticket_id: str
    activity_type: str
    actor_id: Optional[str]
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True

class HistoryEntry(BaseModel):
    id: str
    ticket_id: str
    changed_by: Optional[str]
    change_type: str
    old_value: Optional[str]
    new_value: Optional[str]
    reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True

class AttachmentCreate(BaseModel):
    filename: str
    url: str
    mime_type: Optional[str] = Field(default=None)

class AttachmentRead(BaseModel):
    id: str
    ticket_id: str
    uploader_id: Optional[str]
    filename: str
    url: str
    mime_type: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True
