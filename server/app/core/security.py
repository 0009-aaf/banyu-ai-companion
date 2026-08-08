"""密码哈希与 JWT 签发/校验。

安全关键模块（Protected Region）。bcrypt 哈希不可逆，JWT 用于无状态鉴权。
直接用 bcrypt 库（passlib 1.7.4 与 bcrypt 5.0 不兼容，passlib 已停更）。
"""

import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.core.config import settings

_BCRYPT_MAX = 72  # bcrypt 限制 72 字节


def hash_password(password: str) -> str:
    """密码 -> bcrypt 哈希（超 72 字节截断）。"""
    pw = password.encode("utf-8")[:_BCRYPT_MAX]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """校验明文密码与哈希是否匹配；哈希格式异常返回 False（不抛错）。"""
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:_BCRYPT_MAX], hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str) -> str:
    """签发 JWT，subject 为用户 id。"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> str | None:
    """解码 JWT 返回用户 id；任意失败返回 None（由调用方处理 401）。"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
    sub = payload.get("sub")
    return sub if isinstance(sub, str) else None
