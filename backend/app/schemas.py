from pydantic import BaseModel, Field
from typing import Optional
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

class UserRead(BaseModel):
    id: UUID
    username: str
    full_name: Optional[str]
    role: Optional[str]
    is_active: bool

class PTCreate(BaseModel):
    customer_name: Optional[str]
    category: Optional[str]
    expected_delivery: Optional[datetime]
    priority: Optional[str]
    metadata: Optional[dict] = Field(default_factory=dict)

class PTRead(BaseModel):
    id: UUID
    ticket_number: str
    customer_name: Optional[str]
    category: Optional[str]
    status: str
    priority: Optional[str]
    expected_delivery: Optional[datetime]
    metadata: Optional[dict]

    class Config:
        orm_mode = True
