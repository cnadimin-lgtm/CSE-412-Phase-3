"""
Pydantic models for FastAPI JSON request/response bodies (not the SQL schema — see
backend/schema.sql). Field names follow table/view columns; transaction type is
INCOME or EXPENSE per the database CHECK.
"""

from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

# Matches DECIMAL(10,2) in schema.sql — max magnitude before PostgreSQL overflow.
_MAX_MONEY = 99_999_999.99


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    uid: int
    username: str
    email: str


class DashboardRow(BaseModel):
    budgetid: int
    categoryid: int
    categoryname: str
    limitamount: float
    allocated: float
    spent: float
    current_balance: float
    remaining_budget: float
    islow_stored: bool
    islow_computed: bool


class TransactionDetailRow(BaseModel):
    txnid: int
    uid: int
    username: str
    categoryid: int
    categoryname: str
    amount: float
    date: date
    type: Literal["INCOME", "EXPENSE"]


class CategoryRow(BaseModel):
    categoryid: int
    uid: int
    categoryname: str


class CategoryCreate(BaseModel):
    uid: int
    categoryname: str


class CategoryUpdate(BaseModel):
    uid: int
    categoryname: str


class BudgetRow(BaseModel):
    budgetid: int
    uid: int
    categoryid: int
    categoryname: str
    limitamount: float
    islow: bool


class BudgetCreate(BaseModel):
    uid: int
    categoryid: int
    limitamount: float = Field(ge=0, le=_MAX_MONEY)


class BudgetUpdate(BaseModel):
    uid: int
    limitamount: float = Field(ge=0, le=_MAX_MONEY)


class TransactionCreate(BaseModel):
    uid: int
    categoryid: int
    amount: float = Field(gt=0, le=_MAX_MONEY)
    date: date
    type: Literal["INCOME", "EXPENSE"]


class TransactionUpdate(BaseModel):
    uid: int
    categoryid: int
    amount: float = Field(gt=0, le=_MAX_MONEY)
    date: date
    type: Literal["INCOME", "EXPENSE"]


def dec_to_float(v) -> float:
    if v is None:
        return 0.0
    if isinstance(v, Decimal):
        return float(v)
    return float(v)
