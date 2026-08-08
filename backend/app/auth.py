import os
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.future import select
from sqlalchemy import update
from .database import get_session
from .models import User, RoleEnum
from .core.security import verify_password, get_password_hash, create_access_token, decode_token
from .schemas import Token, UserCreate, UserRead, UserCreateByOwner, UserListResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    q = await session.execute(select(User).where(User.username == username))
    user = q.scalars().first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


@router.post('/login', response_model=Token)
async def login(request: Request, session: AsyncSession = Depends(get_session)):
    """Bulletproof login endpoint supporting form-data (OAuth2) and JSON payloads."""
    username = None
    password = None

    content_type = request.headers.get('content-type', '')
    if 'application/x-www-form-urlencoded' in content_type or 'multipart/form-data' in content_type:
        try:
            form = await request.form()
            username = form.get('username')
            password = form.get('password')
        except Exception:
            pass

    if not username or not password:
        try:
            body = await request.json()
            username = body.get('username')
            password = body.get('password')
        except Exception:
            pass

    if not username or not password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username and password required')

    q = await session.execute(select(User).where(User.username == str(username)))
    user = q.scalars().first()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    if not verify_password(str(password), user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    access_token = create_access_token(subject=str(user.username))
    return {"access_token": access_token, "token_type": "bearer"}


@router.get('/me', response_model=UserRead)
async def read_me(current_user: User = Depends(get_current_user)):
    return current_user


# ──────────────────────────────────────────────────────────────────────────────
# User management — Owner / Admin only
# ──────────────────────────────────────────────────────────────────────────────

OWNER_ROLES = {RoleEnum.owner, RoleEnum.admin}


def require_owner(user: User):
    if user.role not in OWNER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Owner or admin role required')


@router.get('/users', response_model=UserListResponse)
async def list_users(
    role: Optional[str] = Query(default=None, description="Filter by role, e.g. karigar"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Owner/admin: list all users. Karigars may call this to get user info for assigned tickets."""
    q = select(User)
    if role:
        try:
            role_enum = RoleEnum(role)
            q = q.where(User.role == role_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f'Unknown role: {role}')
    result = await session.execute(q.order_by(User.created_at))
    users = result.scalars().all()
    return {"items": [_user_to_dict(u) for u in users], "total": len(users)}


@router.post('/users', response_model=UserRead, status_code=201)
async def create_user(
    payload: UserCreateByOwner,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Owner/admin: create a new user (karigar or any role)."""
    require_owner(current_user)
    existing = await session.execute(select(User).where(User.username == payload.username))
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail='Username already taken')
    try:
        role = RoleEnum(payload.role) if payload.role else RoleEnum.karigar
    except ValueError:
        raise HTTPException(status_code=400, detail=f'Unknown role: {payload.role}')
    user = User(
        username=payload.username,
        full_name=payload.full_name,
        role=role,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.patch('/users/{user_id}', response_model=UserRead)
async def toggle_user(
    user_id: str,
    is_active: bool,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Owner/admin: activate or deactivate a user."""
    require_owner(current_user)
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    await session.execute(update(User).where(User.id == user_id).values(is_active=is_active))
    await session.commit()
    return await session.get(User, user_id)


def _user_to_dict(u: User) -> dict:
    return {
        "id": str(u.id),
        "username": u.username,
        "full_name": u.full_name,
        "role": u.role.value if u.role else None,
        "is_active": u.is_active,
    }
