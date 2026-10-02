# Timedoor Event Revamp Prototype

Standalone Next.js prototype covering the confirmed internship scope:

- Event list and Event Detail tabs
- Schedule management and proposed reschedule cutoff state
- Whole-event reschedule flow
- Individual participant transfer
- Equal, higher, and lower destination-price handling
- Attendance Detail
- Create Event rules for Workshop, Trial, Bootcamp, PTM, and Internal Meeting
- Initial spreadsheet import state (format pending)

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