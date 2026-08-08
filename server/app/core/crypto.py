"""API key AES 加解密（Protected Region - 安全关键）。

用 Fernet（对称加密），主密钥从 ENCRYPT_KEY 派生。
decrypt 失败抛异常，由调用方处理（不吞异常）。
"""

import base64
import hashlib

from cryptography.fernet import Fernet

from app.core.config import settings


def _derive_key() -> bytes:
    """从 ENCRYPT_KEY 派生 Fernet key（sha256 -> urlsafe base64）。"""
    digest = hashlib.sha256(settings.ENCRYPT_KEY.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


_fernet = Fernet(_derive_key())


def encrypt(plaintext: str) -> str:
    """明文 -> 加密字符串。"""
    return _fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt(ciphertext: str) -> str:
    """加密字符串 -> 明文。失败抛异常（调用方 catch）。"""
    return _fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
