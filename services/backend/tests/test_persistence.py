from datetime import UTC, datetime, timedelta
from pathlib import Path

from alembic import command
from alembic.config import Config

from reprosift.persistence import ArtifactKind, Database, InvestigationRepository


def _migrate(database_url: str) -> None:
    backend_root = Path(__file__).parents[1]
    config = Config(str(backend_root / "alembic.ini"))
    config.set_main_option("script_location", str(backend_root / "migrations"))
    config.set_main_option("sqlalchemy.url", database_url)
    command.upgrade(config, "head")


def test_run_history_survives_a_new_database_instance(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'reprosift.db'}"
    _migrate(database_url)
    first_database = Database(database_url)
    first_repository = InvestigationRepository(first_database)
    investigation = first_repository.create_investigation(
        report="SAVE10 remains too large after removing Item B.",
        expected_behavior="The total is $90.00.",
        scenario_id="sample-coupon",
    )
    attempt = first_repository.create_attempt(
        investigation_id=investigation.id,
        deadline_at=datetime.now(UTC) + timedelta(minutes=5),
        limits={"toolCalls": 12},
    )
    first_repository.append_event(
        investigation_id=investigation.id,
        attempt_id=attempt.id,
        event_type="run_started",
        payload={"scenarioId": "sample-coupon"},
    )
    first_repository.record_artifact(
        investigation_id=investigation.id,
        attempt_id=attempt.id,
        kind=ArtifactKind.SCREENSHOT,
        content_type="image/png",
        size_bytes=10,
        checksum="sha256:test",
        storage_key="attempts/one/screenshot.png",
        expires_at=None,
    )
    first_database.dispose()

    second_database = Database(database_url)
    second_repository = InvestigationRepository(second_database)
    restored = second_repository.get_investigation(investigation.id)
    events = second_repository.list_events(investigation.id)

    assert restored == investigation
    assert events[0].sequence == 1
    assert events[0].payload == {"scenarioId": "sample-coupon"}
    second_database.dispose()
