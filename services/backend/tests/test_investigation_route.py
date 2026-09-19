from datetime import UTC, datetime

from fastapi.testclient import TestClient

from reprosift.app import create_app
from reprosift.persistence.models import InvestigationStatus
from reprosift.persistence.repository import Investigation, InvestigationEvent


class FakeInvestigations:
    def __init__(self) -> None:
        self.investigation = Investigation(
            id="investigation-1",
            report="Discount is stale.",
            expected_behavior="Total should be $90.00.",
            scenario_id="sample-coupon",
            status=InvestigationStatus.QUEUED,
            created_at=datetime(2026, 9, 19, tzinfo=UTC),
        )

    def create_investigation(self, **_: str) -> Investigation:
        return self.investigation

    def get_investigation(self, _: str) -> Investigation:
        return self.investigation

    def cancel_investigation(self, _: str) -> Investigation:
        return Investigation(
            **{**self.investigation.__dict__, "status": InvestigationStatus.CANCELLED}
        )

    def list_events(self, _: str) -> tuple[InvestigationEvent, ...]:
        return ()


def test_investigation_routes_create_read_and_cancel() -> None:
    with TestClient(create_app(investigation_reader=FakeInvestigations())) as client:
        created = client.post(
            "/investigations",
            json={
                "report": "Discount is stale.",
                "expectedBehavior": "Total should be $90.00.",
                "scenarioId": "sample-coupon",
            },
        )
        assert created.status_code == 201
        assert created.json()["status"] == "queued"
        assert client.get("/investigations/investigation-1").status_code == 200
        assert (
            client.post("/investigations/investigation-1/cancel").json()["status"]
            == "cancelled"
        )
