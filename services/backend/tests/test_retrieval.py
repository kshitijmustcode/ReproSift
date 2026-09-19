from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config

from reprosift.persistence import Database
from reprosift.retrieval import RequirementRepository


def _migrate(database_url: str) -> None:
    backend_root = Path(__file__).parents[1]
    config = Config(str(backend_root / "alembic.ini"))
    config.set_main_option("script_location", str(backend_root / "migrations"))
    config.set_main_option("sqlalchemy.url", database_url)
    command.upgrade(config, "head")


def test_markdown_ingestion_returns_versioned_coupon_citation(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'requirements.db'}"
    _migrate(database_url)
    database = Database(database_url)
    repository = RequirementRepository(database)

    document_id = repository.ingest_markdown(
        source_name="sample-case.md",
        version=1,
        markdown=(
            "## Requirement REQ-CART-001, version 1\n\n"
            "A 10% coupon applies to the current merchandise subtotal after any "
            "cart change.\n\n"
            "## Reset state\n\nItem A and Item B begin in the cart."
        ),
    )
    citations = repository.search("coupon subtotal after cart change")

    assert citations[0].document_id == document_id
    assert citations[0].document_version == 1
    assert citations[0].heading == "Requirement REQ-CART-001, version 1"
    assert "10% coupon" in citations[0].content
    with pytest.raises(ValueError, match="cannot be overwritten"):
        repository.ingest_markdown(
            source_name="sample-case.md", version=1, markdown="# different"
        )
    database.dispose()
