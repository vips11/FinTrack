# Financial Tracker

A full-stack personal finance dashboard for tracking expenses, income, subscriptions, and category budgets with real-time bank syncing via Plaid.

## Features

### Dashboard
- Monthly spending overview with allocation bar and hover tooltips
- Category budget progress rows with color-coded status
- Spending trend line chart
- Month navigation
- Linked bank accounts display
- Connect Bank button (Plaid integration)

### Expenses
- Add, edit, and delete expenses
- Sortable columns (date, amount, category, note)
- Month/date picker with calendar — orange dots on days with transactions
- Group by category toggle
- Sync button to pull latest from bank

### Income
- Track income sources with add/edit/delete
- Same sorting, date filtering, and sync as expenses

### Subscriptions (Recurring)
- Track recurring expenses (monthly, yearly, weekly)
- Assign to categories
- Auto-detected from bank transactions via keyword rules

### Spending Plan (Categories)
- Create custom categories with colors
- Set **per-month budgets** — different budgets for different months
- Budget allocation donut chart (allocated vs unallocated)
- Spending breakdown donut chart
- Click any category for detail page with 6-month trend chart

### Authentication
- Google sign-in via Firebase Auth
- All data scoped per user

### Bank Sync (Plaid)
- Connect real bank accounts via Plaid Link
- Auto-import transactions on sync
- Auto-categorization via keyword matching rules
- Recurring transaction detection

## Tech Stack

### Frontend
- React 19 + Vite
- React Router (HashRouter for GitHub Pages)
- Recharts (charts)
- react-day-picker (calendar)
- Firebase Auth
- CSS custom properties (no UI framework)

### Backend
- Node.js + Express
- MongoDB (Atlas)
- Firebase Admin (token verification)
- Plaid SDK (bank connections)

### Hosting
- Frontend: GitHub Pages
- Backend: Render (free tier)
- Database: MongoDB Atlas (free tier)

## Development

```bash
# Frontend
npm install
npm run dev

# Backend
cd server
npm install
node index.js
```

## Environment Variables

### Frontend (`.env`)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:5000/api
```

### Backend (`server/.env`)
```
PORT=5000
MONGODB_URI=
FIREBASE_PROJECT_ID=
PLAID_CLIENT_ID=
PLAID_SECRET_DEVELOPMENT=
PLAID_SECRET_SANDBOX=
PLAID_ENV=development
```

## Future Roadmap

### LLM Integration
- **Smart categorization**: Use an LLM to categorize uncategorized transactions based on merchant name, amount patterns, and context — replacing keyword rules with intelligent classification
- **Spending insights**: Generate natural language summaries like "You spent 40% more on dining this month compared to last month" or "Your grocery spending is trending up"
- **Budget recommendations**: Suggest budget adjustments based on actual spending patterns — "You consistently overspend on Food & Dining, consider increasing to $600/mo"
- **Anomaly detection**: Flag unusual transactions — "This $500 charge at a new merchant doesn't match your typical spending"
- **Savings suggestions**: Identify subscriptions you rarely use, find cheaper alternatives, or suggest areas to cut back

### Additional Features
- **Email/password authentication** — alternative to Google sign-in
- **CSV import** — bulk upload transactions from bank exports
- **Multi-currency support** — for travel or international accounts
- **Recurring transaction auto-generation** — auto-create expense entries when subscriptions are due
- **Shared budgets** — household/partner budget collaboration
- **Goals & savings trackers** — save for specific targets with progress visualization
- **Bill reminders & notifications** — push alerts for upcoming bills or budget thresholds
- **Export to PDF/CSV** — monthly reports and tax-ready summaries
- **Investment tracking** — portfolio balance alongside spending
- **Canadian open banking** — direct bank API access when Consumer-Directed Finance launches (2026-2027)
- **Budget threshold notifications** — push/email alerts when spending reaches a user-provided threshold of a category budget
- **Mobile app** — React Native or PWA for on-the-go tracking
