"""Web Push 推送 - pywebpush 封装。

Protected Region: VAPID 签名 + 推送逻辑。
"""

import json

from pywebpush import WebPushException, webpush

from app.core.config import settings


def send_push(
    endpoint: str,
    p256dh: str,
    auth: str,
    payload: dict,
) -> bool:
    """发送 Web Push 通知。

    失败返回 False（不抛异常，调用方降级为应用内消息）。
    """
    if not settings.VAPID_PUBLIC_KEY or not settings.VAPID_PRIVATE_KEY:
        # VAPID 未配置，跳过推送
        return False

    subscription_info = {
        "endpoint": endpoint,
        "keys": {"p256dh": p256dh, "auth": auth},
    }

    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload, ensure_ascii=False),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": "mailto:admin@banyu.app"},
        )
        return True
    except WebPushException:
        return False
    except Exception:
        return False
