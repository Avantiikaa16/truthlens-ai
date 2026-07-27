import os
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.session import get_db

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user.id),
        "email": user.email,
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXPIRE_HOURS),
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(authorization: str | None) -> dict | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization[len("Bearer "):]

    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


async def get_current_user(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = _decode_token(authorization)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or missing credentials.")

    user = await db.get(User, uuid.UUID(payload["sub"]))

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or missing credentials.")

    return user


async def get_optional_user(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    payload = _decode_token(authorization)

    if not payload:
        return None

    return await db.get(User, uuid.UUID(payload["sub"]))
