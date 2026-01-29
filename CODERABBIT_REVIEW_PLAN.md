# CodeRabbit Modular Review Plan - IMSys

This document outlines the strategy for a comprehensive code review of the IMSys application using CodeRabbit CLI.

## Modular Breakdown

The application is divided into "soluble modules" to stay within rate limits and ensure focused reviews.

### 1. Infrastructure & Security (High Priority)
- **Scope**: `backend/config/`, `backend/middlewares/`, `.env`, `docker-compose.yml`
- **Focus**: Database connections, authentication logic, error handling, environment security.

### 2. Database & Schema
- **Scope**: `backend/models/`, `backend/seeder.js`
- **Focus**: Data integrity, indexing, model relationships, seeder security.

### 3. Core Business Logic - Finance
- **Scope**: `backend/controllers/` (bill, invoice, payment, transaction, expense)
- **Focus**: Transactional integrity, calculations, STK push logic, M-Pesa integration.

### 4. Core Business Logic - Network & Management
- **Scope**: `backend/controllers/` (mikrotikRouter, mikrotikUser, hotspotUser, hotspotPlan, tenant, package, lead, ticket)
- **Focus**: API interaction with Mikrotik, user session management, tenant isolation.

### 5. API Layer
- **Scope**: `backend/routes/`
- **Focus**: Route protection, parameter validation, REST conventions.

### 6. Frontend Core
- **Scope**: `frontend/src/app/`, `frontend/src/components/`
- **Focus**: Next.js App Router patterns, component efficiency, UI consistency.

### 7. Frontend Utils & State
- **Scope**: `frontend/src/lib/`, `frontend/src/hooks/`
- **Focus**: Custom hooks, utility functions, state management.

## Review Status Tracking

| Module | Status | Report Link | Critical Issues |
| :--- | :--- | :--- | :--- |
| Infrastructure | 🟡 In Progress | [infrastructure.md](coderabbit_reports/infrastructure.md) | 0 |
| Models | ⚪ Pending | - | - |
| Finance | ⚪ Pending | - | - |
| Network | ⚪ Pending | - | - |
| Routes | ⚪ Pending | - | - |
| Frontend Core | ⚪ Pending | - | - |
| Frontend Utils | ⚪ Pending | - | - |

## Documentation Strategy
- All reviews are stored in `coderabbit_reports/`.
- For each module, a report is generated using `coderabbit review --plain`.
- AI analysis of the report identifies "Critical" and "Security" issues.
- Fixes are applied and documented in the module report.

---
**Note**: We are currently hitting CodeRabbit CLI rate limits (Free tier). Next batch of reviews can proceed after the cooldown period.
