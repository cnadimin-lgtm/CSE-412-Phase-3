"""
PostgreSQL helpers for the Student Budgeting API.

SOURCE OF TRUTH (do not invent columns/types here — mirror these files):
  - backend/schema.sql          … tables `users`, `categories`, `budget`, `transactions`;
                                views `transaction_details`, `category_bucket_summary`
  - backend/data_generation.py … seed users/passwords and demo data (run after schema)

Environment variables match `data_generation.connect()` / `.env.example`:
  DB_NAME, DB_USER, DB_PASSWORD, optional DB_HOST (default localhost), DB_PORT (default 5432).
Settings are loaded with python-dotenv from backend/.env (same keys the seed script expects).

All SQL uses parameters (%s);
"""

from pathlib import Path
import os

import psycopg2
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def required_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        raise RuntimeError(f"Missing required environment variable --> {name}")
    return value


def get_connection():
    return psycopg2.connect(
        dbname=required_env("DB_NAME"),
        user=required_env("DB_USER"),
        password=required_env("DB_PASSWORD"),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
    )

# function for enforcing the rule that a category must belong to a user
def category_belongs_to_user(conn, uid: int, categoryid: int) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM categories WHERE uid = %s AND categoryid = %s",
            (uid, categoryid),
        )
        return cur.fetchone() is not None

# function for enforcing the rule that a transaction must belong to a user
def transaction_belongs_to_user(conn, txnid: int, uid: int) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM transactions WHERE txnid = %s AND uid = %s",
            (txnid, uid),
        )
        return cur.fetchone() is not None

# function for enforcing the rule that a budget must belong to a user
def budget_belongs_to_user(conn, budgetid: int, uid: int) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM budget WHERE budgetid = %s AND uid = %s",
            (budgetid, uid),
        )
        return cur.fetchone() is not None

# function for enforcing the rule that a user must exist
def user_exists(conn, uid: int) -> bool:
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM users WHERE uid = %s", (uid,))
        return cur.fetchone() is not None

# function for getting the balance of a category
def get_category_balance(conn, uid: int, categoryid: int) -> float:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)
                - COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)
            FROM transactions
            WHERE uid = %s AND categoryid = %s
            """,
            (uid, categoryid),
        )
        row = cur.fetchone()
        return float(row[0]) if row and row[0] is not None else 0.0

# function for getting the balance of a category excluding a transaction
def get_category_balance_excluding_txn(
    conn, uid: int, categoryid: int, txnid: int
) -> float:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)
                - COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)
            FROM transactions
            WHERE uid = %s AND categoryid = %s AND txnid <> %s
            """,
            (uid, categoryid, txnid),
        )
        row = cur.fetchone()
        return float(row[0]) if row and row[0] is not None else 0.0

# function for refreshing the islow flag of a budget
def refresh_islow(conn, uid: int, categoryid: int) -> None:
    bal = get_category_balance(conn, uid, categoryid)
    with conn.cursor() as cur:
        cur.execute(
            "SELECT limitamount FROM budget WHERE uid = %s AND categoryid = %s",
            (uid, categoryid),
        )
        row = cur.fetchone()
        if not row:
            return
        limitamount = float(row[0])
        islow = bal <= limitamount
        cur.execute(
            """
            UPDATE budget
            SET islow = %s
            WHERE uid = %s AND categoryid = %s
            """,
            (islow, uid, categoryid),
        )
