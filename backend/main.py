"""
FastAPI application for the Student Budgeting backend.

Database shape and view definitions come only from backend/schema.sql:
  - Tables: users, categories, budget, transactions (column names used exactly in SQL).
  - Reads use views transaction_details and category_bucket_summary as defined there.
  - Transaction type values are exactly 'INCOME' | 'EXPENSE' (CHECK in schema).

Seed / demo logins and IDs come from backend/data_generation.py.

All SQL is parameterized; values are never concatenated into query strings.
"""

from typing import Generator, List

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import db as dbmod
from schemas import (
    BudgetCreate,
    BudgetRow,
    BudgetUpdate,
    CategoryCreate,
    CategoryRow,
    CategoryUpdate,
    DashboardRow,
    LoginRequest,
    LoginResponse,
    TransactionCreate,
    TransactionDetailRow,
    TransactionUpdate,
    dec_to_float,
)

app = FastAPI(title="Student Budgeting API", version="1.0.0")

# Local dev: allow any port on localhost / 127.0.0.1 (Vite may use 5174, 5175, … if 5173 is taken).
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> Generator:
    conn = dbmod.get_connection()
    try:
        yield conn
    finally:
        conn.close()


def row_transaction_detail(row) -> TransactionDetailRow:
    return TransactionDetailRow(
        txnid=row[0],
        uid=row[1],
        username=row[2],
        categoryid=row[3],
        categoryname=row[4],
        amount=dec_to_float(row[5]),
        date=row[6],
        type=row[7],
    )


@app.post("/auth/login", response_model=LoginResponse)
def login(body: LoginRequest, conn=Depends(get_db)):
    # Production apps should hash passwords (e.g. bcrypt) and compare hashes — not plain text.
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT uid, username, email
            FROM users
            WHERE username = %s AND password = %s
            """,
            (body.username.strip(), body.password),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return LoginResponse(uid=row[0], username=row[1], email=row[2])


@app.get("/users/{uid}/dashboard", response_model=List[DashboardRow])
def get_dashboard(uid: int, conn=Depends(get_db)):
    if not dbmod.user_exists(conn, uid):
        raise HTTPException(status_code=404, detail="User not found")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                budgetid,
                categoryid,
                categoryname,
                limitamount,
                allocated,
                spent,
                current_balance,
                remaining_budget,
                islow_stored,
                islow_computed
            FROM category_bucket_summary
            WHERE uid = %s
            ORDER BY categoryname
            """,
            (uid,),
        )
        rows = cur.fetchall()
    out: List[DashboardRow] = []
    for r in rows:
        out.append(
            DashboardRow(
                budgetid=r[0],
                categoryid=r[1],
                categoryname=r[2],
                limitamount=dec_to_float(r[3]),
                allocated=dec_to_float(r[4]),
                spent=dec_to_float(r[5]),
                current_balance=dec_to_float(r[6]),
                remaining_budget=dec_to_float(r[7]),
                islow_stored=bool(r[8]),
                islow_computed=bool(r[9]),
            )
        )
    return out


@app.get("/users/{uid}/transactions", response_model=List[TransactionDetailRow])
def list_transactions(uid: int, conn=Depends(get_db)):
    if not dbmod.user_exists(conn, uid):
        raise HTTPException(status_code=404, detail="User not found")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT txnid, uid, username, categoryid, categoryname, amount, date, type
            FROM transaction_details
            WHERE uid = %s
            ORDER BY date DESC, txnid DESC
            """,
            (uid,),
        )
        rows = cur.fetchall()
    return [row_transaction_detail(r) for r in rows]


@app.get("/users/{uid}/categories", response_model=List[CategoryRow])
def list_categories(uid: int, conn=Depends(get_db)):
    if not dbmod.user_exists(conn, uid):
        raise HTTPException(status_code=404, detail="User not found")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT categoryid, uid, categoryname
            FROM categories
            WHERE uid = %s
            ORDER BY categoryname
            """,
            (uid,),
        )
        rows = cur.fetchall()
    return [
        CategoryRow(categoryid=r[0], uid=r[1], categoryname=r[2]) for r in rows
    ]


@app.post("/categories", response_model=CategoryRow)
def create_category(body: CategoryCreate, conn=Depends(get_db)):
    name = body.categoryname.strip()
    if not name:
        raise HTTPException(status_code=400, detail="categoryname cannot be empty")
    if not dbmod.user_exists(conn, body.uid):
        raise HTTPException(status_code=404, detail="User not found")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT 1 FROM categories
            WHERE uid = %s AND categoryname = %s
            """,
            (body.uid, name),
        )
        if cur.fetchone():
            raise HTTPException(
                status_code=400,
                detail="A category with this name already exists for this user",
            )
        cur.execute(
            """
            INSERT INTO categories (uid, categoryname)
            VALUES (%s, %s)
            RETURNING categoryid, uid, categoryname
            """,
            (body.uid, name),
        )
        row = cur.fetchone()
    conn.commit()
    return CategoryRow(categoryid=row[0], uid=row[1], categoryname=row[2])


@app.put("/categories/{categoryid}", response_model=CategoryRow)
def update_category(categoryid: int, body: CategoryUpdate, conn=Depends(get_db)):
    name = body.categoryname.strip()
    if not name:
        raise HTTPException(status_code=400, detail="categoryname cannot be empty")
    if not dbmod.category_belongs_to_user(conn, body.uid, categoryid):
        raise HTTPException(
            status_code=404, detail="Category not found or not owned by user",
        )
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT 1 FROM categories
            WHERE uid = %s AND categoryname = %s AND categoryid <> %s
            """,
            (body.uid, name, categoryid),
        )
        if cur.fetchone():
            raise HTTPException(
                status_code=400,
                detail="A category with this name already exists for this user",
            )
        cur.execute(
            """
            UPDATE categories
            SET categoryname = %s
            WHERE categoryid = %s AND uid = %s
            RETURNING categoryid, uid, categoryname
            """,
            (name, categoryid, body.uid),
        )
        row = cur.fetchone()
    conn.commit()
    return CategoryRow(categoryid=row[0], uid=row[1], categoryname=row[2])


class DeleteOk(BaseModel):
    ok: bool
    message: str


@app.delete("/categories/{categoryid}", response_model=DeleteOk)
def delete_category(
    categoryid: int, uid: int = Query(..., description="Owner user id"),
    conn=Depends(get_db),
):
    if not dbmod.category_belongs_to_user(conn, uid, categoryid):
        raise HTTPException(
            status_code=404, detail="Category not found or not owned by user",
        )
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) FROM transactions
            WHERE uid = %s AND categoryid = %s
            """,
            (uid, categoryid),
        )
        count = cur.fetchone()[0]
        if count > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete category: transactions exist for this category",
            )
        cur.execute(
            "DELETE FROM categories WHERE categoryid = %s AND uid = %s",
            (categoryid, uid),
        )
    conn.commit()
    return DeleteOk(ok=True, message="Category deleted")


@app.get("/users/{uid}/budgets", response_model=List[BudgetRow])
def list_budgets(uid: int, conn=Depends(get_db)):
    if not dbmod.user_exists(conn, uid):
        raise HTTPException(status_code=404, detail="User not found")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT b.budgetid, b.uid, b.categoryid, c.categoryname, b.limitamount, b.islow
            FROM budget b
            JOIN categories c ON b.uid = c.uid AND b.categoryid = c.categoryid
            WHERE b.uid = %s
            ORDER BY c.categoryname
            """,
            (uid,),
        )
        rows = cur.fetchall()
    return [
        BudgetRow(
            budgetid=r[0],
            uid=r[1],
            categoryid=r[2],
            categoryname=r[3],
            limitamount=dec_to_float(r[4]),
            islow=bool(r[5]),
        )
        for r in rows
    ]


@app.post("/budgets", response_model=BudgetRow)
def create_budget(body: BudgetCreate, conn=Depends(get_db)):
    if not dbmod.user_exists(conn, body.uid):
        raise HTTPException(status_code=404, detail="User not found")
    if not dbmod.category_belongs_to_user(conn, body.uid, body.categoryid):
        raise HTTPException(status_code=400, detail="Category does not belong to user")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT 1 FROM budget
            WHERE uid = %s AND categoryid = %s
            """,
            (body.uid, body.categoryid),
        )
        if cur.fetchone():
            raise HTTPException(
                status_code=400,
                detail="A budget already exists for this category",
            )
        cur.execute(
            """
            INSERT INTO budget (uid, categoryid, limitamount, islow)
            VALUES (%s, %s, %s, FALSE)
            RETURNING budgetid
            """,
            (body.uid, body.categoryid, body.limitamount),
        )
        budgetid = cur.fetchone()[0]
    conn.commit()
    dbmod.refresh_islow(conn, body.uid, body.categoryid)
    conn.commit()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT b.budgetid, b.uid, b.categoryid, c.categoryname, b.limitamount, b.islow
            FROM budget b
            JOIN categories c ON b.uid = c.uid AND b.categoryid = c.categoryid
            WHERE b.budgetid = %s
            """,
            (budgetid,),
        )
        r = cur.fetchone()
    return BudgetRow(
        budgetid=r[0],
        uid=r[1],
        categoryid=r[2],
        categoryname=r[3],
        limitamount=dec_to_float(r[4]),
        islow=bool(r[5]),
    )


@app.put("/budgets/{budgetid}", response_model=BudgetRow)
def update_budget(budgetid: int, body: BudgetUpdate, conn=Depends(get_db)):
    if not dbmod.budget_belongs_to_user(conn, budgetid, body.uid):
        raise HTTPException(
            status_code=404, detail="Budget not found or not owned by user",
        )
    with conn.cursor() as cur:
        cur.execute(
            "SELECT categoryid FROM budget WHERE budgetid = %s AND uid = %s",
            (budgetid, body.uid),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Budget not found")
        categoryid = row[0]
        cur.execute(
            """
            UPDATE budget
            SET limitamount = %s
            WHERE budgetid = %s AND uid = %s
            """,
            (body.limitamount, budgetid, body.uid),
        )
    conn.commit()
    dbmod.refresh_islow(conn, body.uid, categoryid)
    conn.commit()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT b.budgetid, b.uid, b.categoryid, c.categoryname, b.limitamount, b.islow
            FROM budget b
            JOIN categories c ON b.uid = c.uid AND b.categoryid = c.categoryid
            WHERE b.budgetid = %s
            """,
            (budgetid,),
        )
        r = cur.fetchone()
    return BudgetRow(
        budgetid=r[0],
        uid=r[1],
        categoryid=r[2],
        categoryname=r[3],
        limitamount=dec_to_float(r[4]),
        islow=bool(r[5]),
    )


@app.delete("/budgets/{budgetid}", response_model=DeleteOk)
def delete_budget(
    budgetid: int, uid: int = Query(..., description="Owner user id"),
    conn=Depends(get_db),
):
    if not dbmod.budget_belongs_to_user(conn, budgetid, uid):
        raise HTTPException(
            status_code=404, detail="Budget not found or not owned by user",
        )
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM budget WHERE budgetid = %s AND uid = %s",
            (budgetid, uid),
        )
    conn.commit()
    return DeleteOk(ok=True, message="Budget deleted")


@app.post("/transactions", response_model=TransactionDetailRow)
def create_transaction(body: TransactionCreate, conn=Depends(get_db)):
    if not dbmod.user_exists(conn, body.uid):
        raise HTTPException(status_code=404, detail="User not found")
    if not dbmod.category_belongs_to_user(conn, body.uid, body.categoryid):
        raise HTTPException(status_code=400, detail="Category does not belong to user")
    bal = dbmod.get_category_balance(conn, body.uid, body.categoryid)
    if body.type == "EXPENSE" and body.amount > bal:
        raise HTTPException(
            status_code=400,
            detail="Expense would exceed current balance for this category",
        )
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO transactions (uid, categoryid, amount, date, type)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING txnid
            """,
            (body.uid, body.categoryid, body.amount, body.date, body.type),
        )
        txnid = cur.fetchone()[0]
    conn.commit()
    dbmod.refresh_islow(conn, body.uid, body.categoryid)
    conn.commit()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT txnid, uid, username, categoryid, categoryname, amount, date, type
            FROM transaction_details
            WHERE txnid = %s
            """,
            (txnid,),
        )
        row = cur.fetchone()
    return row_transaction_detail(row)


def projected_balance_after_update(
    bal_excluding: float, amount: float, typ: str
) -> float:
    if typ == "INCOME":
        return bal_excluding + amount
    return bal_excluding - amount


@app.put("/transactions/{txnid}", response_model=TransactionDetailRow)
def update_transaction(txnid: int, body: TransactionUpdate, conn=Depends(get_db)):
    if not dbmod.transaction_belongs_to_user(conn, txnid, body.uid):
        raise HTTPException(
            status_code=404, detail="Transaction not found or not owned by user",
        )
    if not dbmod.category_belongs_to_user(conn, body.uid, body.categoryid):
        raise HTTPException(status_code=400, detail="Category does not belong to user")

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT categoryid, amount, type
            FROM transactions
            WHERE txnid = %s AND uid = %s
            """,
            (txnid, body.uid),
        )
        old = cur.fetchone()
    if not old:
        raise HTTPException(status_code=404, detail="Transaction not found")
    old_cat = int(old[0])

    new_cat = body.categoryid

    if old_cat == new_cat:
        bal_excl = dbmod.get_category_balance_excluding_txn(
            conn, body.uid, old_cat, txnid
        )
        new_bal = projected_balance_after_update(
            bal_excl, body.amount, body.type
        )
        if new_bal < 0:
            raise HTTPException(
                status_code=400,
                detail="Update would make category balance negative",
            )
    else:
        bal_old_after = dbmod.get_category_balance_excluding_txn(
            conn, body.uid, old_cat, txnid
        )
        if bal_old_after < 0:
            raise HTTPException(
                status_code=400,
                detail="Update would make old category balance negative",
            )
        bal_new_excl = dbmod.get_category_balance_excluding_txn(
            conn, body.uid, new_cat, txnid
        )
        new_bal = projected_balance_after_update(
            bal_new_excl, body.amount, body.type
        )
        if new_bal < 0:
            raise HTTPException(
                status_code=400,
                detail="Update would make new category balance negative",
            )

    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE transactions
            SET categoryid = %s, amount = %s, date = %s, type = %s
            WHERE txnid = %s AND uid = %s
            """,
            (
                body.categoryid,
                body.amount,
                body.date,
                body.type,
                txnid,
                body.uid,
            ),
        )
    conn.commit()

    cats_to_refresh = {old_cat, new_cat}
    for cid in cats_to_refresh:
        dbmod.refresh_islow(conn, body.uid, cid)
    conn.commit()

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT txnid, uid, username, categoryid, categoryname, amount, date, type
            FROM transaction_details
            WHERE txnid = %s
            """,
            (txnid,),
        )
        row = cur.fetchone()
    return row_transaction_detail(row)


@app.delete("/transactions/{txnid}", response_model=DeleteOk)
def delete_transaction(
    txnid: int, uid: int = Query(..., description="Owner user id"),
    conn=Depends(get_db),
):
    if not dbmod.transaction_belongs_to_user(conn, txnid, uid):
        raise HTTPException(
            status_code=404, detail="Transaction not found or not owned by user",
        )
    with conn.cursor() as cur:
        cur.execute(
            "SELECT categoryid, type FROM transactions WHERE txnid = %s AND uid = %s",
            (txnid, uid),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Transaction not found")
    categoryid, typ = int(row[0]), row[1]

    if typ == "INCOME":
        bal_after = dbmod.get_category_balance_excluding_txn(
            conn, uid, categoryid, txnid
        )
        if bal_after < 0:
            raise HTTPException(
                status_code=400,
                detail="Deleting this income would make the category balance negative",
            )

    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM transactions WHERE txnid = %s AND uid = %s",
            (txnid, uid),
        )
    conn.commit()
    dbmod.refresh_islow(conn, uid, categoryid)
    conn.commit()
    return DeleteOk(ok=True, message="Transaction deleted")
