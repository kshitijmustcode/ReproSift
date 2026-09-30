"""Celery task construction with explicit failure ownership and no action retries."""

from __future__ import annotations

from typing import Protocol

from celery import Celery  # type: ignore[import-untyped]

from reprosift.config import Settings


class InvestigationJob(Protocol):
    def run(self, attempt_id: str) -> None: ...

    def fail(self, attempt_id: str, reason: str) -> None: ...


def create_celery_app(settings: Settings) -> Celery:
    app = Celery("reprosift", broker=settings.redis_url, backend=settings.redis_url)
    app.conf.update(
        task_acks_late=True,
        task_acks_on_failure_or_timeout=False,
        task_default_queue="investigations",
        worker_concurrency=settings.max_active_investigations,
        worker_prefetch_multiplier=1,
    )
    return app


class InvestigationTaskRunner:
    """Runs one attempt once and records a defined failure without retrying it."""

    def __init__(self, job: InvestigationJob) -> None:
        self._job = job

    def run_once(self, attempt_id: str) -> None:
        try:
            self._job.run(attempt_id)
        except Exception:
            self._job.fail(attempt_id, "Worker execution failed before completion.")
            raise
