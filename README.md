# BuildBihar — Construction Management & AI House Planning Platform

## Quick Start

```powershell
# 1. Start MongoDB (if not running as service)
mongod

# 2. Start everything
.\start.ps1
```

## URLs
| Service | URL |
|---|---|
| Public Website | http://localhost:5173 |
| AI House Planner | http://localhost:5173/ai-planner |
| Owner Dashboard | http://localhost:5173/dashboard |
| Backend API | http://localhost:5000/api |

## Architecture

```
constration_site/
├── backend/
│   └── src/
│       ├── config/        # DB + rates config
│       ├── controllers/   # Business logic
│       ├── models/        # MongoDB schemas
│       ├── routes/        # Express routes
│       └── server.js
└── frontend/
    └── src/
        ├── api/           # Axios API layer
        ├── components/    # Shared UI components
        ├── context/       # React Context
        ├── pages/
        │   ├── public/    # Home, About, Services, Projects, Contact
        │   ├── ai/        # AI Planner
        │   └── dashboard/ # Owner dashboard modules
        └── utils/
```

## Dashboard Modules
- **Clients** — Full CRM with status tracking
- **Projects** — Project cards with progress tracking
- **Workers** — Worker registry
- **Attendance** — Daily marking + monthly report
- **Salary** — Auto-calculate wages with advance deduction
- **Materials** — Project-wise inventory tracking
- **Quotations** — AI-generated cost quotations
- **Diary** — Daily construction logs with photos
- **Enquiries** — Website lead management + convert to client
