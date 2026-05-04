# CSE 412 Phase 03 — Student Budgeting

FastAPI backend + PostgreSQL (`backend/`), React frontend (`frontend/`).

**Backend:** Copy `backend/.env.example` to `backend/.env` and set database connection values. Then:

```
cd backend
pip install -r requirements.txt
py data_generation.py
uvicorn main:app --reload
```

API: http://localhost:8000/docs

**Frontend:**

```
cd frontend
npm install
npm run dev
```

Copy `frontend/.env.example` to `frontend/.env`. Use `VITE_API_URL=http://localhost:8000`. App runs at http://localhost:5173

**Seed logins:** aryan / pass123 · gaurang / pass456 · magdalene / pass789 · charan / pass321

Schema and seed data live in `backend/schema.sql` and `backend/data_generation.py`.
