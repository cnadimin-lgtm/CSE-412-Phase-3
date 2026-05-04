import os
from pathlib import Path

import psycopg2


BASE_DIR = Path(__file__).resolve().parent

# Loads environment variables from backend/.env (see .env.example).

# the env should have the following variables: DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, SCHEMA_FILE
# DB_NAME is the name of the database
# DB_USER is the username to connect to the database
# DB_PASSWORD is the password to connect to the database
# DB_HOST is the host of the database
# DB_PORT is the port of the database
# SCHEMA_FILE is the path to the schema.sql file

def load_env_file() -> None:
    env_path = BASE_DIR / ".env"

    if not env_path.exists():
        raise FileNotFoundError(f"No env file yet")

    with env_path.open("r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()

            if not line or line.startswith("#"):
                continue

            if "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")

            os.environ[key] = value


def required_env(name: str) -> str:
    value = os.getenv(name)

    if value is None or value.strip() == "":
        raise RuntimeError(f"Missing required environment variable: {name}")

    return value


def connect():
    return psycopg2.connect(
        dbname=required_env("DB_NAME"),
        user=required_env("DB_USER"),
        password=required_env("DB_PASSWORD"),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
    )

# Schema path defaults to schema.sql beside this script (override with SCHEMA_FILE).
def run_schema(conn) -> None:
    schema_file = os.getenv("SCHEMA_FILE", "schema.sql")
    schema_path = BASE_DIR / schema_file

    if not schema_path.exists():
        raise FileNotFoundError(f"Schema file not found: {schema_path}")

    sql = schema_path.read_text(encoding="utf-8")

    with conn.cursor() as cur:
        cur.execute(sql)

    conn.commit()
    print(f"Schema executed from {schema_file}")

# Inserts seed rows documented in SQL comments below.
def seed_data(conn) -> None:
    sql = """
    -- Reset all seed data and restart auto-generated IDs.
    -- This keeps category IDs predictable every time the script runs.
    TRUNCATE TABLE transactions, budget, categories, users RESTART IDENTITY CASCADE;

    -- Users used for login/demo testing.
    INSERT INTO users (username, password, email)
    VALUES
    ('aryan', 'pass123', 'aryan@asu.edu'),
    ('gaurang', 'pass456', 'gaurang@asu.edu'),
    ('magdalene', 'pass789', 'magdalene@asu.edu'),
    ('charan', 'pass321', 'charan@asu.edu');

    -- Categories are user-owned bucket labels.
    -- Even if two users both have "Food", those are separate rows with separate category IDs.
    INSERT INTO categories (uid, categoryname)
    VALUES
    -- Aryan categories: IDs 1-5
    (1, 'Food'),
    (1, 'Rent'),
    (1, 'Transport'),
    (1, 'Utilities'),
    (1, 'Entertainment'),

    -- Gaurang categories: IDs 6-10
    (2, 'Food'),
    (2, 'Rent'),
    (2, 'Transport'),
    (2, 'Entertainment'),
    (2, 'School Supplies'),

    -- Magdalene categories: IDs 11-15
    (3, 'Food'),
    (3, 'Rent'),
    (3, 'Transport'),
    (3, 'Utilities'),
    (3, 'School Supplies'),

    -- Charan categories: IDs 16-20
    (4, 'Food'),
    (4, 'Rent'),
    (4, 'Transport'),
    (4, 'Utilities'),
    (4, 'Entertainment');

    -- Budget: limitamount = balance floor; islow when current_balance <= limitamount.
    INSERT INTO budget (uid, categoryid, limitamount, islow)
    VALUES
    -- Aryan (balance / threshold / islow)
    (1, 1, 100.00, FALSE),
    (1, 2, 0.00, TRUE),
    (1, 3, 60.00, FALSE),
    (1, 4, 40.00, TRUE),
    (1, 5, 80.00, FALSE),

    -- Gaurang
    (2, 6, 100.00, FALSE),
    (2, 7, 55.00, TRUE),
    (2, 8, 70.00, FALSE),
    (2, 9, 35.00, TRUE),
    (2, 10, 60.00, FALSE),

    -- Magdalene
    (3, 11, 65.00, TRUE),
    (3, 12, 250.00, FALSE),
    (3, 13, 75.00, FALSE),
    (3, 14, 40.00, TRUE),
    (3, 15, 60.00, FALSE),

    -- Charan
    (4, 16, 120.00, FALSE),
    (4, 17, 0.00, TRUE),
    (4, 18, 65.00, FALSE),
    (4, 19, 90.00, FALSE),
    (4, 20, 25.00, TRUE);

    -- Transactions model money movement inside category buckets.
    -- INCOME adds money to the category bucket.
    -- EXPENSE removes money from the category bucket.
    -- Every transaction uses a category owned by the same uid.
    INSERT INTO transactions (uid, categoryid, amount, date, type)
    VALUES
    -- Aryan: Food budget 300, allocated 300, spent 165, balance 135, islow false
    (1, 1, 300.00, '2026-04-01', 'INCOME'),
    (1, 1, 45.00, '2026-04-02', 'EXPENSE'),
    (1, 1, 60.00, '2026-04-09', 'EXPENSE'),
    (1, 1, 35.00, '2026-04-16', 'EXPENSE'),
    (1, 1, 25.00, '2026-04-22', 'EXPENSE'),

    -- Aryan: Rent budget 950, allocated 950, spent 950, balance 0, islow true
    (1, 2, 950.00, '2026-04-01', 'INCOME'),
    (1, 2, 950.00, '2026-04-03', 'EXPENSE'),

    -- Aryan: Transport budget 150, allocated 150, spent 65, balance 85, islow false
    (1, 3, 150.00, '2026-04-01', 'INCOME'),
    (1, 3, 20.00, '2026-04-05', 'EXPENSE'),
    (1, 3, 15.00, '2026-04-13', 'EXPENSE'),
    (1, 3, 30.00, '2026-04-20', 'EXPENSE'),

    -- Aryan: Utilities budget 220, allocated 220, spent 185, balance 35, islow true
    (1, 4, 220.00, '2026-04-01', 'INCOME'),
    (1, 4, 95.00, '2026-04-06', 'EXPENSE'),
    (1, 4, 50.00, '2026-04-14', 'EXPENSE'),
    (1, 4, 40.00, '2026-04-21', 'EXPENSE'),

    -- Aryan: Entertainment budget 180, allocated 180, spent 80, balance 100, islow false
    (1, 5, 180.00, '2026-04-01', 'INCOME'),
    (1, 5, 30.00, '2026-04-08', 'EXPENSE'),
    (1, 5, 50.00, '2026-04-18', 'EXPENSE'),


    -- Gaurang: Food budget 275, allocated 275, spent 145, balance 130, islow false
    (2, 6, 275.00, '2026-04-01', 'INCOME'),
    (2, 6, 35.00, '2026-04-03', 'EXPENSE'),
    (2, 6, 50.00, '2026-04-10', 'EXPENSE'),
    (2, 6, 60.00, '2026-04-19', 'EXPENSE'),

    -- Gaurang: Rent budget 900, allocated 900, spent 850, balance 50, islow true
    (2, 7, 900.00, '2026-04-01', 'INCOME'),
    (2, 7, 850.00, '2026-04-04', 'EXPENSE'),

    -- Gaurang: Transport budget 140, allocated 140, spent 55, balance 85, islow false
    (2, 8, 140.00, '2026-04-01', 'INCOME'),
    (2, 8, 20.00, '2026-04-07', 'EXPENSE'),
    (2, 8, 15.00, '2026-04-15', 'EXPENSE'),
    (2, 8, 20.00, '2026-04-25', 'EXPENSE'),

    -- Gaurang: Entertainment budget 200, allocated 200, spent 170, balance 30, islow true
    (2, 9, 200.00, '2026-04-01', 'INCOME'),
    (2, 9, 70.00, '2026-04-06', 'EXPENSE'),
    (2, 9, 55.00, '2026-04-16', 'EXPENSE'),
    (2, 9, 45.00, '2026-04-23', 'EXPENSE'),

    -- Gaurang: School Supplies budget 120, allocated 120, spent 40, balance 80, islow false
    (2, 10, 120.00, '2026-04-01', 'INCOME'),
    (2, 10, 25.00, '2026-04-09', 'EXPENSE'),
    (2, 10, 15.00, '2026-04-17', 'EXPENSE'),


    -- Magdalene: Food budget 325, allocated 325, spent 270, balance 55, islow true
    (3, 11, 325.00, '2026-04-01', 'INCOME'),
    (3, 11, 90.00, '2026-04-04', 'EXPENSE'),
    (3, 11, 80.00, '2026-04-12', 'EXPENSE'),
    (3, 11, 60.00, '2026-04-19', 'EXPENSE'),
    (3, 11, 40.00, '2026-04-26', 'EXPENSE'),

    -- Magdalene: Rent budget 1000, allocated 1000, spent 700, balance 300, islow false
    (3, 12, 1000.00, '2026-04-01', 'INCOME'),
    (3, 12, 700.00, '2026-04-02', 'EXPENSE'),

    -- Magdalene: Transport budget 160, allocated 160, spent 70, balance 90, islow false
    (3, 13, 160.00, '2026-04-01', 'INCOME'),
    (3, 13, 30.00, '2026-04-08', 'EXPENSE'),
    (3, 13, 20.00, '2026-04-14', 'EXPENSE'),
    (3, 13, 20.00, '2026-04-23', 'EXPENSE'),

    -- Magdalene: Utilities budget 210, allocated 210, spent 180, balance 30, islow true
    (3, 14, 210.00, '2026-04-01', 'INCOME'),
    (3, 14, 75.00, '2026-04-05', 'EXPENSE'),
    (3, 14, 65.00, '2026-04-13', 'EXPENSE'),
    (3, 14, 40.00, '2026-04-22', 'EXPENSE'),

    -- Magdalene: School Supplies budget 130, allocated 130, spent 55, balance 75, islow false
    (3, 15, 130.00, '2026-04-01', 'INCOME'),
    (3, 15, 35.00, '2026-04-09', 'EXPENSE'),
    (3, 15, 20.00, '2026-04-18', 'EXPENSE'),


    -- Charan: Food budget 290, allocated 290, spent 150, balance 140, islow false
    (4, 16, 290.00, '2026-04-01', 'INCOME'),
    (4, 16, 55.00, '2026-04-03', 'EXPENSE'),
    (4, 16, 45.00, '2026-04-11', 'EXPENSE'),
    (4, 16, 50.00, '2026-04-20', 'EXPENSE'),

    -- Charan: Rent budget 875, allocated 875, spent 875, balance 0, islow true
    (4, 17, 875.00, '2026-04-01', 'INCOME'),
    (4, 17, 875.00, '2026-04-04', 'EXPENSE'),

    -- Charan: Transport budget 145, allocated 145, spent 65, balance 80, islow false
    (4, 18, 145.00, '2026-04-01', 'INCOME'),
    (4, 18, 25.00, '2026-04-07', 'EXPENSE'),
    (4, 18, 15.00, '2026-04-15', 'EXPENSE'),
    (4, 18, 25.00, '2026-04-24', 'EXPENSE'),

    -- Charan: Utilities budget 225, allocated 225, spent 120, balance 105, islow false
    (4, 19, 225.00, '2026-04-01', 'INCOME'),
    (4, 19, 60.00, '2026-04-06', 'EXPENSE'),
    (4, 19, 35.00, '2026-04-15', 'EXPENSE'),
    (4, 19, 25.00, '2026-04-21', 'EXPENSE'),

    -- Charan: Entertainment budget 175, allocated 175, spent 155, balance 20, islow true
    (4, 20, 175.00, '2026-04-01', 'INCOME'),
    (4, 20, 60.00, '2026-04-08', 'EXPENSE'),
    (4, 20, 50.00, '2026-04-17', 'EXPENSE'),
    (4, 20, 45.00, '2026-04-25', 'EXPENSE');
    """

    with conn.cursor() as cur:
        cur.execute(sql)

    conn.commit()
    


def main() -> None:
    load_env_file()

    print("Connecting to database with")
    print(f"DB_NAME={os.getenv('DB_NAME')}")
    print(f"DB_USER={os.getenv('DB_USER')}")
    print(f"DB_HOST={os.getenv('DB_HOST', 'localhost')}")
    print(f"DB_PORT={os.getenv('DB_PORT', '5432')}")

    conn = connect()

    try:
        print("\nRunning schema.sql")
        run_schema(conn)

        print("\nInserting pre-built data")
        seed_data(conn)

        print("\ndb setup complete")
    finally:
        conn.close()


if __name__ == "__main__":
    main()