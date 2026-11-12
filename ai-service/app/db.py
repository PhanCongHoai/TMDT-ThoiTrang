import pyodbc
from contextlib import contextmanager
from app.config import DB_SERVER, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, ODBC_DRIVER


def _detect_driver() -> str:
    available = pyodbc.drivers()
    for preferred in [ODBC_DRIVER, "ODBC Driver 18 for SQL Server", "ODBC Driver 17 for SQL Server", "SQL Server"]:
        if preferred in available:
            return preferred
    return ODBC_DRIVER


def get_connection() -> pyodbc.Connection:
    driver = _detect_driver()
    server_str = f"{DB_SERVER},{DB_PORT}" if DB_PORT else DB_SERVER
    conn_str = (
        f"DRIVER={{{driver}}};"
        f"SERVER={server_str};"
        f"DATABASE={DB_NAME};"
        f"UID={DB_USER};"
        f"PWD={DB_PASSWORD};"
        "TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str, timeout=15)


@contextmanager
def db_cursor(commit: bool = False):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        if commit:
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

