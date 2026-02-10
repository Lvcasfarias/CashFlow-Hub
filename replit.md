# CashFlow Hub

## Overview
CashFlow Hub is a personal finance management application built with React (frontend) and Express.js (backend), using PostgreSQL as the database. It uses the "caixinhas" (envelopes) budgeting method to help users manage their finances.

## Project Architecture
- **Frontend**: React (CRA with CRACO), Tailwind CSS, Radix UI components, located in `frontend/`
- **Backend**: Express.js REST API with JWT authentication, located in `backend/`
- **Database**: PostgreSQL (Replit built-in)

## Project Structure
```
frontend/           - React frontend (port 5000 in dev)
  src/
    components/     - UI components (Radix-based)
    context/        - React context providers (Auth)
    hooks/          - Custom React hooks
    lib/            - Utilities and API client
    pages/          - Page components
  craco.config.js   - CRACO configuration with dev server proxy
backend/            - Express.js API server (port 3000)
  config/           - Database configuration
  database/         - SQL migrations and init scripts
  middleware/       - Auth middleware (JWT)
  routes/           - API route handlers
```

## Key Configuration
- Frontend dev server proxies `/api` requests to backend on port 3000
- Backend uses `BACKEND_PORT` env var (default: 3000)
- Frontend uses `PORT=5000` via workflow command
- JWT authentication with `JWT_SECRET` env var
- Database connection via `DATABASE_URL` env var

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `JWT_SECRET` - Secret key for JWT token signing
- `REACT_APP_BACKEND_URL` - API base URL (set to `/api` for proxy)
- `BACKEND_PORT` - Backend server port (default: 3000)

## Running
The workflow runs both backend and frontend together:
- Backend: `node server.js` (port 3000, localhost)
- Frontend: `npx craco start` (port 5000, 0.0.0.0)

## Recent Changes
- 2026-02-10: Initial Replit setup - configured dev server proxy, allowed all hosts, set up PostgreSQL database with all tables
