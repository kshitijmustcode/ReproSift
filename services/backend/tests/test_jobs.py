import pytest

from reprosift.config import Settings
from reprosift.jobs import InvestigationTaskRunner, create_celery_app


class FailingJob:
    def __init__(self) -> None:
        self.failures: list[tuple[str, str]] = []

    def run(self, _: str) -> None:
        raise RuntimeError("browser disconnected")

    def fail(self, attempt_id: str, reason: str) -> None:
        self.failures.append((attempt_id, reason))


def test_worker_failure_is_recorded_without_retrying_actions() -> None:
    job = FailingJob()
    with pytest.raises(RuntimeError, match="browser disconnected"):
        InvestigationTaskRunner(job).run_once("attempt-1")
    assert job.failures == [("attempt-1", "Worker execution failed before completion.")]


def test_celery_configuration_limits_worker_concurrency() -> None:
    app = create_celery_app(Settings(max_active_investigations=1))
    assert app.conf.worker_concurrency == 1
    assert app.conf.task_acks_late is True
    assert app.conf.worker_prefetch_multiplier == 1
