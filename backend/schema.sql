-- schema.sql
-- Student Budgeting Application
-- Phase 03 database schema
-- Tables: users, categories, budget, transactions
-- Views: transaction_details, category_bucket_summary

DROP VIEW IF EXISTS category_bucket_summary CASCADE;
DROP VIEW IF EXISTS transaction_details CASCADE;

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS budget CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    uid SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE categories (
    categoryid SERIAL PRIMARY KEY,
    uid INT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    categoryname VARCHAR(50) NOT NULL,
    UNIQUE (uid, categoryid),
    UNIQUE (uid, categoryname)
);

CREATE TABLE budget (
    budgetid SERIAL PRIMARY KEY,
    uid INT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    categoryid INT NOT NULL,
    limitamount DECIMAL(10,2) NOT NULL CHECK (limitamount >= 0),
    islow BOOLEAN DEFAULT FALSE,
    UNIQUE (uid, categoryid),
    FOREIGN KEY (uid, categoryid)
        REFERENCES categories(uid, categoryid)
        ON DELETE CASCADE
);

CREATE TABLE transactions (
    txnid SERIAL PRIMARY KEY,
    uid INT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    categoryid INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    FOREIGN KEY (uid, categoryid)
        REFERENCES categories(uid, categoryid)
        ON DELETE CASCADE
);

-- View: transaction_details
-- Provides a readable transaction history by joining transactions with users
-- and categories. This lets the application display usernames and category names
-- instead of only showing raw uid and categoryid values.
CREATE VIEW transaction_details AS
SELECT
    t.txnid,
    t.uid,
    u.username,
    t.categoryid,
    c.categoryname,
    t.amount,
    t.date,
    t.type
FROM transactions t
JOIN users u
    ON t.uid = u.uid
JOIN categories c
    ON t.uid = c.uid
   AND t.categoryid = c.categoryid;

-- View: category_bucket_summary
-- Summarizes each user's category bucket by showing the budget limit,
-- total allocated income, total expenses, current balance, remaining budget,
-- stored low-balance status, and computed low-balance status.
-- In this design, islow means the category bucket's current balance is low:
-- TRUE when current_balance <= 20% of limitamount.
CREATE VIEW category_bucket_summary AS
SELECT
    b.budgetid,
    b.uid,
    u.username,
    b.categoryid,
    c.categoryname,
    b.limitamount,
    COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE 0 END), 0)::DECIMAL(10,2) AS allocated,
    COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END), 0)::DECIMAL(10,2) AS spent,
    (
        COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE 0 END), 0)
        -
        COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END), 0)
    )::DECIMAL(10,2) AS current_balance,
    (
        b.limitamount
        -
        COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END), 0)
    )::DECIMAL(10,2) AS remaining_budget,
    b.islow AS islow_stored,
    CASE
        WHEN (
            COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE 0 END), 0)
            -
            COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END), 0)
        ) <= 0.2 * b.limitamount
        THEN TRUE
        ELSE FALSE
    END AS islow_computed
FROM budget b
JOIN users u
    ON b.uid = u.uid
JOIN categories c
    ON b.uid = c.uid
   AND b.categoryid = c.categoryid
LEFT JOIN transactions t
    ON b.uid = t.uid
   AND b.categoryid = t.categoryid
GROUP BY
    b.budgetid,
    b.uid,
    u.username,
    b.categoryid,
    c.categoryname,
    b.limitamount,
    b.islow;