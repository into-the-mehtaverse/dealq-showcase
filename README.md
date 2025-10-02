# DealQ Monorepo

This monorepo contains:

- `/frontend` – Next.js client app
- `/backend` – FastAPI server

## Local Dev

```bash
# Run frontend
cd frontend && npm run dev

# Run backend
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload
