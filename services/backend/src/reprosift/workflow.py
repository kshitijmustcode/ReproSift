"""Bounded LangGraph orchestration for one evidence-only investigation attempt."""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Protocol, TypedDict

from langgraph.graph import END, START, StateGraph

from reprosift.mcp.browser_client import BrowserWorkflowEvidence
from reprosift.openai_provider import InvestigationPlan, ModelResult
from reprosift.retrieval import RequirementCitation


class RequirementSearch(Protocol):
    def search(
        self, query: str, *, limit: int = 3
    ) -> tuple[RequirementCitation, ...]: ...


class PlanProvider(Protocol):
    def propose_plan(self, *, report: str, requirement_context: str) -> ModelResult: ...


class BrowserWorkflow(Protocol):
    async def apply_coupon_and_remove_item_b(self) -> BrowserWorkflowEvidence: ...


class WorkflowState(TypedDict, total=False):
    report: str
    citations: tuple[RequirementCitation, ...]
    plan: InvestigationPlan
    evidence: BrowserWorkflowEvidence


@dataclass(frozen=True)
class InvestigationObservation:
    citations: tuple[RequirementCitation, ...]
    plan: InvestigationPlan
    evidence: BrowserWorkflowEvidence


class InvestigationWorkflowError(RuntimeError):
    """Safe failure when a bounded workflow cannot collect required observations."""


class InvestigationWorkflow:
    """Connects retrieval, structured planning, and scoped browser execution once."""

    def __init__(
        self,
        *,
        requirement_search: RequirementSearch,
        plan_provider: PlanProvider,
        browser_workflow: BrowserWorkflow,
    ) -> None:
        self._requirement_search = requirement_search
        self._plan_provider = plan_provider
        self._browser_workflow = browser_workflow
        graph = StateGraph(WorkflowState)
        graph.add_node("retrieve_requirements", self._retrieve_requirements)
        graph.add_node("plan_next_step", self._plan_next_step)
        graph.add_node(
            "collect_browser_evidence",
            self._collect_browser_evidence,  # type: ignore[arg-type]  # LangGraph's async node stub infers Never.
        )
        graph.add_edge(START, "retrieve_requirements")
        graph.add_edge("retrieve_requirements", "plan_next_step")
        graph.add_edge("plan_next_step", "collect_browser_evidence")
        graph.add_edge("collect_browser_evidence", END)
        self._graph = graph.compile()

    async def investigate(self, report: str) -> InvestigationObservation:
        result = await self._graph.ainvoke({"report": report})
        citations = result.get("citations")
        plan = result.get("plan")
        evidence = result.get("evidence")
        if not isinstance(citations, tuple) or not isinstance(plan, InvestigationPlan):
            raise InvestigationWorkflowError(
                "Investigation workflow returned incomplete observations."
            )
        if not isinstance(evidence, BrowserWorkflowEvidence):
            raise InvestigationWorkflowError(
                "Investigation workflow returned incomplete browser evidence."
            )
        return InvestigationObservation(
            citations=citations, plan=plan, evidence=evidence
        )

    def _retrieve_requirements(self, state: WorkflowState) -> WorkflowState:
        citations = self._requirement_search.search(state["report"])
        if not citations:
            raise InvestigationWorkflowError(
                "No approved requirement context matched this report."
            )
        return {"citations": citations}

    def _plan_next_step(self, state: WorkflowState) -> WorkflowState:
        citations = state["citations"]
        context = _citation_context(citations)
        result = self._plan_provider.propose_plan(
            report=state["report"], requirement_context=context
        )
        return {"plan": result.plan}

    async def _collect_browser_evidence(self, _: WorkflowState) -> WorkflowState:
        return {
            "evidence": await self._browser_workflow.apply_coupon_and_remove_item_b()
        }


def _citation_context(citations: Sequence[RequirementCitation]) -> str:
    return "\n\n".join(
        f"[{citation.source_name} v{citation.document_version}, {citation.heading}]\n"
        f"{citation.content}"
        for citation in citations
    )
