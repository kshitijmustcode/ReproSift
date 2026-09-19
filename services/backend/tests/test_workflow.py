import asyncio
from dataclasses import dataclass

from reprosift.mcp.browser_client import (
    BrowserEvidenceScreenshot,
    BrowserWorkflowEvidence,
)
from reprosift.openai_provider import InvestigationPlan, ModelResult, ModelUsage
from reprosift.retrieval import RequirementCitation
from reprosift.workflow import InvestigationWorkflow


@dataclass
class FakeSearch:
    citation: RequirementCitation

    def search(self, query: str, *, limit: int = 3) -> tuple[RequirementCitation, ...]:
        assert "discount" in query
        assert limit == 3
        return (self.citation,)


class FakeProvider:
    def propose_plan(self, *, report: str, requirement_context: str) -> ModelResult:
        assert report
        assert "REQ-CART-001" in requirement_context
        return ModelResult(
            plan=InvestigationPlan(
                summary="Inspect cart arithmetic.",
                requirement_ids=("REQ-CART-001",),
                next_step="Run the bounded cart workflow.",
            ),
            usage=ModelUsage(input_tokens=1, output_tokens=1),
            model="fake",
        )


class FakeBrowser:
    async def apply_coupon_and_remove_item_b(self) -> BrowserWorkflowEvidence:
        return BrowserWorkflowEvidence(
            artifact_id="artifact-1",
            session_id="session-1",
            actions=("reset /cart",),
            console_messages=(),
            network_requests=(),
            screenshot=BrowserEvidenceScreenshot(
                session_id="session-1",
                content_type="image/png",
                base64="image",
                captured_at="2026-09-19T00:00:00Z",
            ),
        )


def test_workflow_connects_citation_plan_and_raw_browser_evidence() -> None:
    workflow = InvestigationWorkflow(
        requirement_search=FakeSearch(
            RequirementCitation(
                document_id="doc-1",
                document_version=1,
                chunk_id="chunk-1",
                source_name="sample-case.md",
                heading="Requirement REQ-CART-001",
                content="Coupon changes with the subtotal.",
                score=4,
            )
        ),
        plan_provider=FakeProvider(),
        browser_workflow=FakeBrowser(),
    )

    result = asyncio.run(workflow.investigate("The discount is stale after removal."))

    assert result.citations[0].chunk_id == "chunk-1"
    assert result.plan.requirement_ids == ("REQ-CART-001",)
    assert result.evidence.actions == ("reset /cart",)
