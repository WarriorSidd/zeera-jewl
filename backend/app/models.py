from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Enum
import uuid
from .database import Base
from datetime import datetime
import enum

class RoleEnum(str, enum.Enum):
    owner = 'owner'
    admin = 'admin'
    production_manager = 'production_manager'
    office = 'office'
    karigar = 'karigar'
    accounts = 'accounts'
    qc = 'qc'

class User(Base):
    __tablename__ = 'users'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.office)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
