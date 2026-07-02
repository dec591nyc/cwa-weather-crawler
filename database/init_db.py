from pathlib import Path
from database.connection import get_connection
from config import settings


def init_db() -> None:
    schema_path = Path(__file__).with_name("schema.sql")
    with get_connection(settings.database_path) as conn:
        conn.executescript(schema_path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    init_db()
    print(f"Initialized database: {settings.database_path}")
