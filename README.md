# PACE Agent System

## Framework
Based on [PACE Framework](https://pace-framework.org/) — Plan · Architect · Code · Evaluate

## Agents
| Agent | SKILL | Role |
|-------|-------|------|
| BuilderAgent | builder.SKILL.md | TDD code generation via Ollama |
| DevOpsAgent | devops.SKILL.md | Git commit |
| ScribeAgent | — | Handoff documentation |

## Mock Jira Stories
- PACE-001: User Authentication API
- PACE-002: Todo List CRUD API
- PACE-003: User Profile Management
- PACE-004: Notifications API

## Setup
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm start
```

## URLs
- Dashboard: http://localhost:4200
- API: http://localhost:3000
