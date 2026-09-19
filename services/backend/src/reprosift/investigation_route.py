"""HTTP boundary for persisted investigation workspace data."""

from __future__ import annotations

from typing import Literal, Protocol

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from reprosift.persistence.repository import Investigation, InvestigationEvent


class InvestigationReader(Protocol):
    def create_investigation(
        self, *, report: str, expected_behavior: str, scenario_id: str
    ) -> Investigation: ...

    def get_investigation(self, investigation_id: str) -> Investigation | None: ...

    def cancel_investigation(self, investigation_id: str) -> Investigation | None: ...

    def list_events(self, investigation_id: str) -> tuple[InvestigationEvent, ...]: ...


class CreateInvestigationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    report: str = Field(min_length=1, max_length=4_000)
    expected_behavior: str = Field(
        alias="expectedBehavior", min_length=1, max_length=4_000
    )
    scenario_id: str = Field(alias="scenarioId", min_length=1, max_length=128)


class InvestigationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    report: str
    expected_behavior: str = Field(alias="expectedBehavior")
    scenario_id: str = Field(alias="scenarioId")
    status: Literal[
        "queued",
        "running",
        "replaying",
        "completed",
        "failed",
        "cancelled",
        "interrupted",
    ]
    created_at: str = Field(alias="createdAt")


class EventResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    sequence: int
    event_type: str = Field(alias="type")
    timestamp: str


def create_investigation_router(reader: InvestigationReader) -> APIRouter:
    router = APIRouter(prefix="/investigations", tags=["investigations"])

    @router.post("", response_model=InvestigationResponse, status_code=201)
    def create_investigation(
        request: CreateInvestigationRequest,
    ) -> InvestigationResponse:
        return _investigation_response(
            reader.create_investigation(
                report=request.report,
                expected_behavior=request.expected_behavior,
                scenario_id=request.scenario_id,
            )
        )

    @router.get("/{investigation_id}", response_model=InvestigationResponse)
    def get_investigation(investigation_id: str) -> InvestigationResponse:
        investigation = reader.get_investigation(investigation_id)
        if investigation is None:
            raise HTTPException(status_code=404, detail="Investigation was not found.")
        return _investigation_response(investigation)

    @router.get("/{investigation_id}/events", response_model=list[EventResponse])
    def list_events(investigation_id: str) -> list[EventResponse]:
        if reader.get_investigation(investigation_id) is None:
            raise HTTPException(status_code=404, detail="Investigation was not found.")
        return [
            _event_response(event) for event in reader.list_events(investigation_id)
        ]

    @router.post("/{investigation_id}/cancel", response_model=InvestigationResponse)
    def cancel_investigation(investigation_id: str) -> InvestigationResponse:
        investigation = reader.cancel_investigation(investigation_id)
        if investigation is None:
            raise HTTPException(status_code=404, detail="Investigation was not found.")
        return _investigation_response(investigation)

    return router


def _investigation_response(investigation: Investigation) -> InvestigationResponse:
    return InvestigationResponse(
        id=investigation.id,
        report=investigation.report,
        expected_behavior=investigation.expected_behavior,
        scenario_id=investigation.scenario_id,
        status=investigation.status.value,
        created_at=investigation.created_at.isoformat().replace("+00:00", "Z"),
    )


def _event_response(event: InvestigationEvent) -> EventResponse:
    return EventResponse(
        id=event.id,
        sequence=event.sequence,
        event_type=event.event_type,
        timestamp=event.timestamp.isoformat().replace("+00:00", "Z"),
    )
