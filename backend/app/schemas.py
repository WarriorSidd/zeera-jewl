from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = None


class UserCreateByOwner(BaseModel):
    """Used by owner to create a new user (karigar or otherwise)."""
    username: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = Field(default='karigar', description="Role of the new user")


class UserRead(BaseModel):
    id: UUID
    username: str
    full_name: Optional[str]
    role: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True
        orm_mode = True


class UserListResponse(BaseModel):
    items: List[UserRead]
    total: int


# Legacy – kept for backward compat; the real ones live in production/schemas.py
class PTCreate(BaseModel):
    customer_name: Optional[str] = None
    category: Optional[str] = None
    expected_delivery: Optional[datetime] = None
    priority: Optional[str] = None
    metadata: Optional[dict] = Field(default_factory=dict)


class PTRead(BaseModel):
    id: UUID
    ticket_number: str
    customer_name: Optional[str] = None
    category: Optional[str] = None
    status: str
    priority: Optional[str] = None
    expected_delivery: Optional[datetime] = None
    metadata: Optional[dict] = None

    class Config:
        orm_mode = True
