# Timedoor Event Revamp Prototype

Standalone Next.js prototype covering the confirmed internship scope. The demo
uses one normalized event model and browser persistence so every core flow can
be exercised without a backend:

- Event list and Event Detail tabs
- Schedule management and proposed reschedule cutoff state
- Whole-event reschedule flow
- Individual participant transfer
- Equal, higher, and lower destination-price handling
- Attendance Detail
- Create Event rules for Workshop, Trial, Bootcamp, PTM, and Internal Meeting
- Initial spreadsheet import state (format pending)
- Working CSV participant import (`name,parent,amountPaid`)
- Editable attendance, lateness, notes, and Meeting Journal
- Dynamic destination eligibility, quota checks, and duplicate prevention
- Persisted invoice/balance entries created by participant transfers
- Figma-aligned two-step reschedule review
- Figma-aligned three-step participant transfer and success states
- Cross-event room/teacher schedule conflict validation
- Future-date validation and protection against active events with zero schedules

## Implemented demo interactions

- Create an event and add it to the event list
- Add and remove schedules while respecting single/multiple schedule rules
- Reschedule an eligible schedule and preserve the participant count
- Block reschedule when attendance has started or the cutoff has passed
- Transfer a participant with equal, higher, or lower destination pricing

Demo data is persisted in browser `localStorage`, including events, schedules,
participants, attendance, transfers, invoices, and balance credits. API, shared
database, authentication, and production authorization rules are intentionally
outside this standalone demo; data is therefore scoped to one browser/device.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
npm start
```

## Deploy to Vercel

Import this folder as a Vercel project. Vercel will detect Next.js automatically.

No environment variables are required. All data is mocked for prototype use.