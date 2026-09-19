"""Versioned Markdown requirement ingestion and deterministic local retrieval."""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select

from reprosift.persistence.database import Database
from reprosift.persistence.models import RequirementChunkRow, RequirementDocumentRow

TOKEN_PATTERN = re.compile(r"[a-z0-9]+")
HEADING_PATTERN = re.compile(r"^#{1,6}\s+(.+)$", re.MULTILINE)


@dataclass(frozen=True)
class RequirementCitation:
    document_id: str
    document_version: int
    chunk_id: str
    source_name: str
    heading: str
    content: str
    score: int


class RequirementRepository:
    """Persists approved requirement text and retrieves source-backed chunks."""

    def __init__(self, database: Database) -> None:
        self._database = database

    def ingest_markdown(self, *, source_name: str, version: int, markdown: str) -> str:
        content_hash = hashlib.sha256(markdown.encode("utf-8")).hexdigest()
        chunks = _chunk_markdown(markdown)
        with self._database.session() as session:
            existing = session.scalar(
                select(RequirementDocumentRow).where(
                    RequirementDocumentRow.source_name == source_name,
                    RequirementDocumentRow.version == version,
                )
            )
            if existing is not None:
                if existing.content_hash != content_hash:
                    raise ValueError("A requirement version cannot be overwritten.")
                return existing.id
            document = RequirementDocumentRow(
                id=_new_id(),
                source_name=source_name,
                version=version,
                content_hash=content_hash,
                created_at=_utc_now(),
            )
            session.add(document)
            session.flush()
            for ordinal, (heading, content) in enumerate(chunks, start=1):
                session.add(
                    RequirementChunkRow(
                        id=_new_id(),
                        document_id=document.id,
                        ordinal=ordinal,
                        heading=heading,
                        content=content,
                    )
                )
        return document.id

    def search(self, query: str, *, limit: int = 3) -> tuple[RequirementCitation, ...]:
        if not 1 <= limit <= 10:
            raise ValueError("Requirement retrieval limit must be between 1 and 10.")
        query_tokens = set(_tokens(query))
        if not query_tokens:
            return ()
        with self._database.session() as session:
            rows = session.execute(
                select(RequirementChunkRow, RequirementDocumentRow).join(
                    RequirementDocumentRow,
                    RequirementChunkRow.document_id == RequirementDocumentRow.id,
                )
            ).all()
        matches = [
            RequirementCitation(
                document_id=document.id,
                document_version=document.version,
                chunk_id=chunk.id,
                source_name=document.source_name,
                heading=chunk.heading,
                content=chunk.content,
                score=len(
                    query_tokens.intersection(
                        _tokens(f"{chunk.heading} {chunk.content}")
                    )
                ),
            )
            for chunk, document in rows
        ]
        return tuple(
            citation
            for citation in sorted(
                matches, key=lambda item: (-item.score, item.chunk_id)
            )
            if citation.score > 0
        )[:limit]


def _chunk_markdown(markdown: str) -> tuple[tuple[str, str], ...]:
    sections = HEADING_PATTERN.split(markdown)
    chunks: list[tuple[str, str]] = []
    for index in range(1, len(sections), 2):
        heading = sections[index].strip()
        content = sections[index + 1].strip()
        if content:
            chunks.append((heading, content))
    if not chunks and markdown.strip():
        chunks.append(("Document", markdown.strip()))
    if not chunks:
        raise ValueError("Requirement document must contain text.")
    return tuple(chunks)


def _tokens(value: str) -> tuple[str, ...]:
    return tuple(TOKEN_PATTERN.findall(value.lower()))


def _new_id() -> str:
    return str(uuid4())


def _utc_now() -> datetime:
    return datetime.now(UTC)
