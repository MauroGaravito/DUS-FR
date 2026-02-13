# DUS Field Report Frontend Reference

## Technology

- React 18
- Vite 5
- Material UI v5
- React Router v6
- `react-markdown` for markdown rendering

## Folder Structure

```text
frontend/src
  app/
    App.jsx
    routes.jsx
    theme.js
  components/
    layout/
      MainLayout.jsx
      TopBar.jsx
      SideNav.jsx
    visits/
      VisitCard.jsx
      VisitList.jsx
      VisitForm.jsx
    entries/
      EntryList.jsx
      EntryItem.jsx
      EntryForm.jsx
    reports/
      ReportViewer.jsx
  pages/
    Login.jsx
    Dashboard.jsx
    VisitDetail.jsx
    ReportPage.jsx
  services/
    api.js
    auth.js
```

## Routing

- `/login` -> login page
- `/dashboard` -> visit list and visit creation
- `/visits/:visitId` -> visit detail with Entries and Report tabs
- `/visits/:visitId/report` -> report-focused entry point

## Auth Handling

- JWT stored in `localStorage` through `services/auth.js`.
- Protected routes use token presence check.
- Login flow and backend contract remain unchanged.

## API Integration

All network calls are centralized in:

- `frontend/src/services/api.js`

This preserves separation of concerns and keeps JSX components focused on UI state.

## UX Patterns Implemented

- Snackbar alerts for success/error feedback.
- Loading states for async operations.
- Disabled action buttons during processing.
- Responsive layouts with mobile-first sizing.
- Large action targets for field usability.

## Reporting UI Behavior

- Markdown report rendered via `react-markdown`.
- AI report `content` is parsed and shown as formatted sections:
- Executive summary
- Observations list
- Findings with severity chips
- Limitations and conclusion

No backend API contract changes were introduced.
