# Cup Budd

World Cup Companion — PWA frontend (Vite + React) and FastAPI backend.

Quickstart (development)

- Frontend
  - cd frontend
  - npm install
  - npm run dev

- Backend
  - cd backend
  - python -m venv .venv
  - .venv\Scripts\activate  (Windows) or source .venv/bin/activate (macOS/Linux)
  - pip install -e .
  - uvicorn app.main:app --reload

Health check: GET /api/v1/health

See docs/ for detailed design and product specifications.
