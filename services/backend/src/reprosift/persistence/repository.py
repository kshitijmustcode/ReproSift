"""Small persistence port for investigation lifecycle records."""

from __future__ import annotations

import json
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Select, select

from reprosift.persistence.database import Database
from reprosift.persistence.models import (
    ArtifactKind,
    ArtifactRow,
    AttemptRow,
    AttemptState,
    EventRow,
    InvestigationRow,
    InvestigationStatus,
)

JsonScalar = str | int | float | bool | None
JsonObject = Mapping[str, JsonScalar]


@dataclass(frozen=True)
class Investigation:
    id: str
    report: str
    expected_behavior: str
    scenario_id: str
    status: InvestigationStatus
    created_at: datetime


@dataclass(frozen=True)
class Attempt:
    id: str
    investigation_id: str
    ordinal: int
    state: AttemptState
    deadline_at: datetime


@dataclass(frozen=True)
class InvestigationEvent:
    id: str
    investigation_id: str
    attempt_id: str | None
    sequence: int
    timestamp: datetime
    event_type: str
    payload: dict[str, JsonScalar]


@dataclass(frozen=True)
class ArtifactMetadata:
    id: str
    investigation_id: str
    attempt_id: str | None
    kind: ArtifactKind
    content_type: str
    size_bytes: int
    checksum: str
    storage_key: str
    created_at: datetime
    expires_at: datetime | None


class InvestigationRepository:
    """Writes immutable run records and reads them after process restarts."""

    def __init__(self, database: Database) -> None:
        self._database = database

    def create_investigation(
        self, *, report: str, expected_behavior: str, scenario_id: str
    ) -> Investigation:
        now = _utc_now()
        row = InvestigationRow(
            id=str(uuid4()),
            report=report,
            expected_behavior=expected_behavior,
            scenario_id=scenario_id,
            status=InvestigationStatus.QUEUED.value,
            created_at=now,
        )
        with self._database.session() as session:
            session.add(row)
        return _investigation_from_row(row)

    def get_investigation(self, investigation_id: str) -> Investigation | None:
        with self._database.session() as session:
            row = session.get(InvestigationRow, investigation_id)
            return _investigation_from_row(row) if row is not None else None

    def create_attempt(
        self, *, investigation_id: str, deadline_at: datetime, limits: JsonObject
    ) -> Attempt:
        with self._database.session() as session:
            investigation = session.get(InvestigationRow, investigation_id)
            if investigation is None:
                raise ValueError(
                    "Cannot create an attempt for an unknown investigation."
                )
            ordinal = session.scalar(
                select(AttemptRow.ordinal)
                .where(AttemptRow.investigation_id == investigation_id)
                .order_by(AttemptRow.ordinal.desc())
                .limit(1)
            )
            row = AttemptRow(
                id=str(uuid4()),
                investigation_id=investigation_id,
                ordinal=(ordinal or 0) + 1,
                state=AttemptState.QUEUED.value,
                deadline_at=deadline_at,
                limits_json=_serialize(limits),
            )
            session.add(row)
            investigation.active_attempt_id = row.id
            investigation.status = InvestigationStatus.QUEUED.value
        return _attempt_from_row(row)

    def append_event(
        self,
        *,
        investigation_id: str,
        attempt_id: str | None,
        event_type: str,
        payload: JsonObject,
        schema_version: int = 1,
    ) -> InvestigationEvent:
        with self._database.session() as session:
            if session.get(InvestigationRow, investigation_id) is None:
                raise ValueError("Cannot append an event for an unknown investigation.")
            sequence = session.scalar(
                select(EventRow.sequence)
                .where(EventRow.investigation_id == investigation_id)
                .order_by(EventRow.sequence.desc())
                .limit(1)
            )
            row = EventRow(
                id=str(uuid4()),
                investigation_id=investigation_id,
                attempt_id=attempt_id,
                sequence=(sequence or 0) + 1,
                timestamp=_utc_now(),
                schema_version=schema_version,
                type=event_type,
                payload_json=_serialize(payload),
            )
            session.add(row)
        return _event_from_row(row)

    def list_events(self, investigation_id: str) -> tuple[InvestigationEvent, ...]:
        with self._database.session() as session:
            statement: Select[tuple[EventRow]] = (
                select(EventRow)
                .where(EventRow.investigation_id == investigation_id)
                .order_by(EventRow.sequence)
            )
            return tuple(_event_from_row(row) for row in session.scalars(statement))

    def record_artifact(
        self,
        *,
        investigation_id: str,
        attempt_id: str | None,
        kind: ArtifactKind,
        content_type: str,
        size_bytes: int,
        checksum: str,
        storage_key: str,
        expires_at: datetime | None,
    ) -> ArtifactMetadata:
        if size_bytes < 0:
            raise ValueError("Artifact size cannot be negative.")
        row = ArtifactRow(
            id=str(uuid4()),
            investigation_id=investigation_id,
            attempt_id=attempt_id,
            kind=kind.value,
            content_type=content_type,
            size_bytes=size_bytes,
            checksum=checksum,
            storage_key=storage_key,
            created_at=_utc_now(),
            expires_at=expires_at,
        )
        with self._database.session() as session:
            if session.get(InvestigationRow, investigation_id) is None:
                raise ValueError(
                    "Cannot record an artifact for an unknown investigation."
                )
            session.add(row)
        return _artifact_from_row(row)


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _serialize(value: JsonObject) -> str:
    return json.dumps(value, separators=(",", ":"), sort_keys=True)


def _investigation_from_row(row: InvestigationRow) -> Investigation:
    return Investigation(
        id=row.id,
        report=row.report,
        expected_behavior=row.expected_behavior,
        scenario_id=row.scenario_id,
        status=InvestigationStatus(row.status),
        created_at=_as_utc(row.created_at),
    )


def _attempt_from_row(row: AttemptRow) -> Attempt:
    return Attempt(
        id=row.id,
        investigation_id=row.investigation_id,
        ordinal=row.ordinal,
        state=AttemptState(row.state),
        deadline_at=_as_utc(row.deadline_at),
    )


def _event_from_row(row: EventRow) -> InvestigationEvent:
    payload = json.loads(row.payload_json)
    if not isinstance(payload, dict):
        raise ValueError("Stored event payload must be an object.")
    return InvestigationEvent(
        id=row.id,
        investigation_id=row.investigation_id,
        attempt_id=row.attempt_id,
        sequence=row.sequence,
        timestamp=_as_utc(row.timestamp),
        event_type=row.type,
        payload=payload,
    )


def _artifact_from_row(row: ArtifactRow) -> ArtifactMetadata:
    return ArtifactMetadata(
        id=row.id,
        investigation_id=row.investigation_id,
        attempt_id=row.attempt_id,
        kind=ArtifactKind(row.kind),
        content_type=row.content_type,
        size_bytes=row.size_bytes,
        checksum=row.checksum,
        storage_key=row.storage_key,
        created_at=_as_utc(row.created_at),
        expires_at=_as_utc(row.expires_at) if row.expires_at is not None else None,
    )


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
