import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.future import select
from .database import get_session
from .models import User
from .core.security import verify_password, get_password_hash, create_access_token, decode_token
from .schemas import Token, UserCreate, UserRead
from sqlalchemy.ext.asyncio import AsyncSession

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
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise credentials_exception
    return user


@router.post('/login', response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_session)):
    q = await session.execute(select(User).where(User.username == form_data.username))
    user = q.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')
    access_token = create_access_token(subject=str(user.username))
    return {"access_token": access_token, "token_type": "bearer"}


@router.get('/me', response_model=UserRead)
async def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post('/register', response_model=UserRead)
async def register(payload: UserCreate, session: AsyncSession = Depends(get_session)):
    user = User(username=payload.username, full_name=payload.full_name, hashed_password=get_password_hash(payload.password))
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
