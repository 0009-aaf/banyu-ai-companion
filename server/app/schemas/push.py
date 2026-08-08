"""Web Push 订阅 Pydantic schema。"""

from pydantic import BaseModel


class PushSubscriptionCreate(BaseModel):
    """前端提交的订阅信息（PushSubscription.toJSON() 格式）。"""

    endpoint: str
    keys: dict[str, str]  # {"p256dh": "...", "auth": "..."}


class PushSubscriptionOut(BaseModel):
    id: str
    endpoint: str

    model_config = {"from_attributes": True}


class PushTestRequest(BaseModel):
    """测试推送请求。"""

    pass
