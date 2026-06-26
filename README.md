# FinTrack

A personal finance dashboard for tracking expenses, income, subscriptions, and category budgets. Built with React + Vite and deployed on GitHub Pages.

## Features

### Dashboard
- Monthly spending overview with allocation bar (hover for tooltips)
- Category budget progress rows with color-coded status
- Spending trend line chart
- Month navigation

### Expenses
- Add, edit, and delete expenses
- Sortable columns (date, amount, category, note)
- Month/date picker with calendar — orange dots on days with transactions
- Group by category toggle

### Income
- Track income sources with add/edit/delete
- Same sorting and date filtering as expenses

### Subscriptions (Recurring)
- Track recurring expenses (monthly, yearly, weekly)
- Assign to categories
- Edit and delete

### Spending Plan (Categories)
- Create custom categories with colors and emoji icons
- Set **per-month budgets** — each month can have different budget amounts
- Budget allocation donut chart showing allocated vs unallocated
- Spending breakdown donut chart
- Click any category to see a detail page with 6-month trend chart and transaction list

### Other
- Dark mode toggle
- All data stored in localStorage (per device/browser)
- CAD currency formatting
- Responsive layout with sidebar navigation

## Tech Stack

- React 19 + Vite
- React Router (HashRouter for GitHub Pages)
- Recharts (charts)
- react-day-picker (calendar)
- CSS custom properties (no UI framework)

## Development

```bash
npm install
npm run dev
```

## Deployment

Deployed automatically via GitHub Actions to GitHub Pages on push to `main`.

## Data Storage

Data is stored in your browser's localStorage. It does not sync across devices or browsers. Clearing browser data will erase all entries.
