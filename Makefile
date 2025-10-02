dev:
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload & \
	cd frontend && npm run dev

# Start just the frontend
frontend:
	cd frontend && npm run dev

# Start just the backend
backend:
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

# Install frontend deps
install-frontend:
	cd frontend && npm install

# Install backend deps
install-backend:
	cd backend && source .venv/bin/activate && uv pip install -r requirements.txt
