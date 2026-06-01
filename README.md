# Cloud-Native Government Project Monitoring and Transparency Platform

A starter monorepo for a cloud-native public project monitoring platform with a React frontend and FastAPI microservices.

## Repository Layout

- `frontend/` - React + Vite dashboard for citizens, engineers, officers, contractors, and admins.
- `services/auth-service/` - Authentication and RBAC service.
- `services/project-service/` - Project management CRUD service.
- `docs/` - Architecture notes and implementation guidance.
- `docker/` - Container-related assets.
- `scripts/` - Utility scripts.

## Phase 1 Scope

This scaffold focuses on the first two weeks:

- JWT-based authentication
- User registration and login
- Profile endpoint
- Project CRUD APIs
- Frontend login, register, dashboard, and project pages

## Local Development

1. Create virtual environments for each Python service.
2. Install backend dependencies with `pip install -r requirements.txt`.
3. Install frontend dependencies with `npm install` inside `frontend/`.
4. Set the environment variables from each `.env.example` file.
5. Start services separately during development.

## Suggested Next Commands

- Start auth service: `uvicorn app.main:app --reload --port 8001`
- Start project service: `uvicorn app.main:app --reload --port 8002`
- Start frontend: `npm run dev`

## Notes

The codebase is intentionally organized so additional services like document, analytics, notification, feedback, and monitoring can be added without refactoring the initial structure.
