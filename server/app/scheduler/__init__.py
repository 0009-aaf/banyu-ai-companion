"""APScheduler 生命周期管理 - 启动/关闭。"""

from app.services.proactive.scheduler import ProactiveScheduler

_scheduler: ProactiveScheduler | None = None


def start_scheduler() -> None:
    """启动主动陪伴调度器（应用启动时调用）。"""
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = ProactiveScheduler()
    _scheduler.start()


def shutdown_scheduler() -> None:
    """关闭调度器（应用关闭时调用）。"""
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown()
        _scheduler = None
