# Timedoor Event Revamp Prototype

Standalone Next.js prototype covering the confirmed internship scope. Core demo
flows use in-memory state, so they can be exercised without a backend:

- Event list and Event Detail tabs
- Schedule management and proposed reschedule cutoff state
- Whole-event reschedule flow
- Individual participant transfer
- Equal, higher, and lower destination-price handling
- Attendance Detail
- Create Event rules for Workshop, Trial, Bootcamp, PTM, and Internal Meeting
- Initial spreadsheet import state (format pending)

## Implemented demo interactions

- Create an event and add it to the event list
- Add and remove schedules while respecting single/multiple schedule rules
- Reschedule an eligible schedule and preserve the participant count
- Block reschedule when attendance has started or the cutoff has passed
- Transfer a participant with equal, higher, or lower destination pricing

Demo data is persisted in browser `localStorage`, including created events,
schedules, and participant transfers. API, shared database, authentication, and
production authorization rules are intentionally outside this standalone demo;
data is therefore scoped to one browser/device.

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