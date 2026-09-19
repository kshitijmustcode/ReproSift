"""Synchronous SQLAlchemy resource factory for bounded backend operations."""

from collections.abc import Generator
from contextlib import contextmanager
from typing import Protocol

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker


class Database:
    """Own the SQLAlchemy lifecycle without opening connections at import time."""

    def __init__(self, database_url: str) -> None:
        self._database_url = database_url
        self._engine = self._create_engine(database_url)
        self._sessions = sessionmaker(bind=self._engine, expire_on_commit=False)

    @property
    def engine(self) -> Engine:
        return self._engine

    @contextmanager
    def session(self) -> Generator[Session]:
        session = self._sessions()
        try:
            yield session
            session.commit()
        except BaseException:
            session.rollback()
            raise
        finally:
            session.close()

    def dispose(self) -> None:
        self._engine.dispose()

    @staticmethod
    def _create_engine(database_url: str) -> Engine:
        url = make_url(database_url)
        engine = create_engine(url, future=True)
        if url.get_backend_name() == "sqlite":
            event.listen(engine, "connect", _enable_sqlite_foreign_keys)
        return engine


class SqliteCursor(Protocol):
    def execute(self, operation: str) -> object: ...

    def close(self) -> None: ...


class SqliteConnection(Protocol):
    def cursor(self) -> SqliteCursor: ...


def _enable_sqlite_foreign_keys(dbapi_connection: SqliteConnection, _: object) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
