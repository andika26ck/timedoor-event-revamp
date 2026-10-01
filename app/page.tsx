"use client";

import { AlertCircle, ArrowLeft, BookOpen, CalendarDays, Check, ChevronDown, FileSpreadsheet, LayoutDashboard, MoreHorizontal, Plus, Search, Settings, Trash2, Upload, UserRound, UsersRound, X } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AttendanceRecord, EventRecord, EventSchedule, EventType, Participant, attendanceStarted, canReschedule, displayDate, ensureAttendance, eventTypeRules, initialEvents, scheduleStart, uid } from "./model";

type Screen = "events" | "detail" | "create" | "attendance";
type Tab = "details" | "participants" | "attendance" | "schedule";
type ScheduleDraft = Omit<EventSchedule, "id">;
const teachers = ["Nimas Sekararum Kinanthi", "Budi Wicaksono"];
const rooms = ["Bill Gates Room", "Steve Jobs Room", "Jeff Bezos Room"];
const blankSchedule = (): ScheduleDraft => ({ date: "2026-10-20", startTime: "13:00", endTime: "15:00", teacher: teachers[0], room: rooms[0] });
const money = (n: number) => n === 0 ? "Free" : `IDR ${n.toLocaleString("en-US")}`;
const DEMO_SCHEMA_VERSION = 4;
const DEMO_STORAGE_KEY = "timedoor-event-revamp-demo-v4";

export default function App() {
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);
  const [screen, setScreen] = useState<Screen>("events");
  const [tab, setTab] = useState<Tab>("schedule");
  const [eventId, setEventId] = useState(initialEvents[0].id);
  const [attendanceId, setAttendanceId] = useState("");
  const [rescheduleId, setRescheduleId] = useState("");
  const [moveId, setMoveId] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) try {
      const payload = JSON.parse(raw);
      if (payload.schemaVersion === DEMO_SCHEMA_VERSION && Array.isArray(payload.events)) setEvents(payload.events);
    } catch { localStorage.removeItem(DEMO_STORAGE_KEY); }
    setReady(true);
  }, []);
  useLayoutEffect(() => {
    if (ready) localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ schemaVersion: DEMO_SCHEMA_VERSION, exportedAt: new Date().toISOString(), events }));
  }, [events, ready]);
  const event = events.find((e) => e.id === eventId) || events[0];
  const update = (id: string, fn: (e: EventRecord) => EventRecord) => setEvents((all) => all.map((e) => e.id === id ? fn(e) : e));
  const open = (id: string, next: Tab = "schedule") => { setEventId(id); setTab(next); setScreen("detail"); };

  return <div className="app-shell">
    <Sidebar onEvents={() => setScreen("events")} />
    <main className="main"><Topbar /><div className="content">
      {screen === "events" && <Events events={events} onOpen={open} onCreate={() => setScreen("create")}
        onReset={() => { if (window.confirm("Reset all demo data to the initial seed?")) setEvents(structuredClone(initialEvents)); }}
        onExport={() => {
          const blob = new Blob([JSON.stringify({ schemaVersion: DEMO_SCHEMA_VERSION, exportedAt: new Date().toISOString(), events }, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "timedoor-event-demo-data.json"; anchor.click(); URL.revokeObjectURL(url);
        }}
        onImport={(next) => setEvents(next)}
      />}
      {screen === "create" && <CreateEvent allEvents={events} onCancel={() => setScreen("events")} onSave={(e) => {
        setEvents((all) => [e, ...all]);
        setEventId(e.id);
        setTab("details");
        setScreen("detail");
      }} />}
      {screen === "detail" && <EventDetail event={event} allEvents={events} tab={tab} setTab={setTab} onBack={() => setScreen("events")} onChange={(fn) => update(event.id, fn)}
        onAttendance={(id) => { setAttendanceId(id); setScreen("attendance"); }} onReschedule={setRescheduleId} onMove={setMoveId} onImport={() => setImportOpen(true)} />}
      {screen === "attendance" && <Attendance event={event} schedule={event.schedules.find((s) => s.id === attendanceId) || event.schedules[0]}
        onBack={() => { setTab("attendance"); setScreen("detail"); }} onChange={(fn) => update(event.id, fn)} />}
    </div></main>
    {rescheduleId && <Reschedule event={event} allEvents={events} schedule={event.schedules.find((s) => s.id === rescheduleId)!} onClose={() => setRescheduleId("")}
      onSave={(next) => { update(event.id, (e) => ({ ...e, schedules: e.schedules.map((s) => s.id === next.id ? next : s) })); setRescheduleId(""); }} />}
    {moveId && <Transfer source={event} participant={events.flatMap((value) => value.participants).find((p) => p.id === moveId)!} events={events} onClose={() => setMoveId("")}
      onConfirm={(destinationId) => transferParticipant(events, setEvents, event.id, destinationId, moveId)} />}
    {importOpen && <ImportParticipants event={event} onClose={() => setImportOpen(false)} onImport={(items) => { update(event.id, (e) => ({ ...e, participants: [...e.participants, ...items] })); setImportOpen(false); }} />}
  </div>;
}

function Sidebar({ onEvents }: { onEvents: () => void }) {
  return <aside className="sidebar"><div className="logo"><span className="logo-mark">↗</span><span>timedoor<br /><b>academy</b></span></div>
    <button className="nav-row" onClick={onEvents}><LayoutDashboard size={17} /> Dashboard</button><div className="nav-label">MENU</div>
    <button className="nav-row disabled-nav" disabled>◔ Analytic</button><button className="nav-row disabled-nav" disabled>▤ Accounting</button>
    <button className="nav-row parent">▣ Product <ChevronDown size={15} /></button><div className="subnav"><button disabled>○ Package</button><button className="active" onClick={onEvents}>● Event</button><button disabled>○ Trial</button></div>
    <button className="nav-row disabled-nav" disabled><UserRound size={17} /> Customer</button><button className="nav-row disabled-nav" disabled><BookOpen size={17} /> Class</button><button className="nav-row disabled-nav" disabled><UsersRound size={17} /> Teacher</button>
  </aside>;
}
function Topbar() { return <header className="topbar"><div /><div className="top-actions"><div className="branch"><small>Branch Availability</small><span>HQ Training <ChevronDown size={13} /></span></div><button className="top-select">Asia/Jakarta <ChevronDown size={14} /></button><div className="avatar">T<i /></div></div></header>; }
function Header({ title, subtitle, back, actions }: { title: string; subtitle?: string; back?: () => void; actions?: React.ReactNode }) {
  return <div className="page-header"><div className="page-title-wrap">{back && <button className="back-btn" onClick={back}><ArrowLeft size={20} /></button>}<div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div></div>{actions && <div className="header-actions">{actions}</div>}</div>;
}

function Events({ events, onOpen, onCreate, onReset, onExport, onImport }: { events: EventRecord[]; onOpen: (id: string) => void; onCreate: () => void; onReset: () => void; onExport: () => void; onImport: (events: EventRecord[]) => void }) {
  const [q, setQ] = useState(""); const [type, setType] = useState(""); const [sort, setSort] = useState("newest"); const [page, setPage] = useState(1);
  const [dataError, setDataError] = useState(""); const fileRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => events.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()) && (!type || e.type === type))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : b.createdAt.localeCompare(a.createdAt)), [events, q, type, sort]);
  useEffect(() => setPage(1), [q, type, sort]); const size = 5, pages = Math.max(1, Math.ceil(filtered.length / size)), rows = filtered.slice((page - 1) * size, page * size);
  return <><Header title="Event" subtitle="Manage events, schedules, participants, and attendance." actions={<><input ref={fileRef} className="hidden-file-input" type="file" accept=".json,application/json" onChange={async (e) => {
      const file = e.target.files?.[0]; if (!file) return;
      try {
        const payload = JSON.parse(await file.text());
        if (payload.schemaVersion !== DEMO_SCHEMA_VERSION || !Array.isArray(payload.events)) throw new Error("Unsupported or invalid demo data file.");
        onImport(payload.events); setDataError("");
      } catch (error) { setDataError(error instanceof Error ? error.message : "Invalid JSON file."); }
      e.target.value = "";
    }} /><button className="btn outline" onClick={() => fileRef.current?.click()}>Import JSON</button><button className="btn outline" onClick={onExport}>Export JSON</button><button className="btn outline" onClick={onReset}>Reset Demo</button><button className="btn primary" onClick={onCreate}><Plus size={16} /> Create Event</button></>} />
    {dataError && <div className="notice warning"><AlertCircle size={17} /> {dataError}</div>}
    <section className="card"><div className="filters"><div className="search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Event" /></div>
      <select value={type} onChange={(e) => setType(e.target.value)}><option value="">All Event Types</option>{Object.keys(eventTypeRules).map((t) => <option key={t}>{t}</option>)}</select>
      <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Newest</option><option value="name">Name A–Z</option></select>
      <button className="text-action" onClick={() => { setQ(""); setType(""); setSort("newest"); }}>Reset Filter</button></div>
      <div className="table-wrap"><table><thead><tr><th>Event Name</th><th>Type</th><th>Schedule</th><th>Participants</th><th>Price</th><th>Status</th></tr></thead><tbody>
        {rows.map((e) => <tr className="clickable" key={e.id} onClick={() => onOpen(e.id)}><td className="green-link">{e.name}</td><td><span className="type-badge">{e.type}</span></td><td>{e.schedules.length === 1 ? `${displayDate(e.schedules[0].date)}, ${e.schedules[0].startTime}` : `${e.schedules.length} schedules`}</td><td>{e.participants.length}/{e.quota}</td><td>{money(e.price)}</td><td><span className={`badge ${e.active ? "success" : "neutral"}`}>{e.active ? "Active" : "Inactive"}</span></td></tr>)}
        {!rows.length && <tr><td colSpan={6} className="empty-state">No events match the current filters.</td></tr>}</tbody></table></div>
      <div className="table-footer"><span>{filtered.length ? `${(page - 1) * size + 1}–${Math.min(page * size, filtered.length)} of ${filtered.length}` : "0 of 0"}</span><button disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button><button disabled={page === pages} onClick={() => setPage(page + 1)}>›</button></div>
    </section></>;
}

function EventDetail({ event, allEvents, tab, setTab, onBack, onChange, onAttendance, onReschedule, onMove, onImport }: {
  event: EventRecord; allEvents: EventRecord[]; tab: Tab; setTab: (t: Tab) => void; onBack: () => void; onChange: (fn: (e: EventRecord) => EventRecord) => void;
  onAttendance: (id: string) => void; onReschedule: (id: string) => void; onMove: (id: string) => void; onImport: () => void;
}) {
  return <><Header title="Detail Event" subtitle={event.name} back={onBack} /><div className="tabs">{(["details", "participants", "schedule", "attendance"] as Tab[]).map((t) => <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
    {tab === "details" && <Details event={event} onChange={onChange} />}{tab === "schedule" && <Schedules event={event} allEvents={allEvents} onChange={onChange} onAttendance={onAttendance} onReschedule={onReschedule} />}
    {tab === "participants" && <Participants event={event} onChange={onChange} onMove={onMove} onImport={onImport} />}{tab === "attendance" && <AttendanceList event={event} onOpen={onAttendance} />}</>;
}
function Details({ event, onChange }: { event: EventRecord; onChange: (fn: (e: EventRecord) => EventRecord) => void }) {
  return <div className="detail-grid"><section className="card"><div className="card-head"><h2>Basic Information</h2></div>{[["Product ID", event.id], ["Branch", event.branch], ["Event Name", event.name], ["Event Type", event.type], ["Book", event.book], ["Language", event.language], ["Base Price", money(event.price)], ["Quota", String(event.quota)]].map(([a, b]) => <div className="detail-row" key={a}><span>{a}</span><b>{b}</b></div>)}
      {event.finance.length > 0 && <><h3>Payment Adjustments</h3>{event.finance.map((entry) => <div className="detail-row" key={entry.id}><span>{entry.participantName}<small>{entry.kind}</small></span><span><b>{money(entry.amount)}</b><small>{entry.status}</small></span></div>)}</>}
    </section>
    <section className="card settings-card"><div className="card-head"><h2><Settings size={18} /> Settings</h2></div><button className="toggle-row toggle-button" onClick={() => onChange((e) => ({ ...e, active: !e.active }))}><b>Active</b><Toggle on={event.active} /></button><div className="detail-row"><span>Student Ordering</span><b>{event.studentOrderable ? "Enabled" : "Disabled"}</b></div></section></div>;
}

function validateSchedule(event: EventRecord, d: ScheduleDraft, ignore = "", allEvents: EventRecord[] = [event]) {
  if (!d.date || !d.startTime || !d.endTime) return "Date and time are required.";
  if (d.endTime <= d.startTime) return "End time must be later than start time.";
  if (new Date(`${d.date}T${d.startTime}:00+07:00`) <= new Date()) return "Schedule must start in the future.";
  const overlaps = (s: EventSchedule) => s.date === d.date && d.startTime < s.endTime && d.endTime > s.startTime;
  const sourceEvents = allEvents.some((value) => value.id === event.id) ? allEvents : [event, ...allEvents];
  const conflict = sourceEvents.flatMap((value) => value.schedules.map((schedule) => ({ value, schedule })))
    .find(({ schedule }) => schedule.id !== ignore && overlaps(schedule) && (schedule.room === d.room || schedule.teacher === d.teacher));
  if (conflict) {
    const resource = conflict.schedule.room === d.room ? `room ${d.room}` : `teacher ${d.teacher}`;
    return `Schedule conflicts with ${conflict.value.name} (${resource}, ${displayDate(d.date)} ${conflict.schedule.startTime}–${conflict.schedule.endTime}).`;
  }
  if (eventTypeRules[event.type].singleSchedule && event.schedules.filter((s) => s.id !== ignore).length >= 1) return `${event.type} supports one schedule only.`;
}
function ScheduleEditor({ initial, label, onSubmit, onCancel }: { initial?: ScheduleDraft; label: string; onSubmit: (d: ScheduleDraft) => string | void; onCancel: () => void }) {
  const [d, setD] = useState(initial || blankSchedule()); const [error, setError] = useState(""); const set = (k: keyof ScheduleDraft, v: string) => setD((x) => ({ ...x, [k]: v }));
  return <div className="schedule-editor"><input aria-label="Schedule Date" type="date" value={d.date} onChange={(e) => set("date", e.target.value)} /><input aria-label="Start Time" type="time" value={d.startTime} onChange={(e) => set("startTime", e.target.value)} /><input aria-label="End Time" type="time" value={d.endTime} onChange={(e) => set("endTime", e.target.value)} />
    <select aria-label="Teacher" value={d.teacher} onChange={(e) => set("teacher", e.target.value)}>{teachers.map((x) => <option key={x}>{x}</option>)}</select><select aria-label="Room" value={d.room} onChange={(e) => set("room", e.target.value)}>{rooms.map((x) => <option key={x}>{x}</option>)}</select>
    <div><button className="btn primary" onClick={() => { const m = onSubmit(d); if (m) setError(m); }}>{label}</button><button className="text-action" onClick={onCancel}>Cancel</button></div>{error && <div className="notice warning schedule-error">{error}</div>}</div>;
}
function Schedules({ event, allEvents, onChange, onAttendance, onReschedule }: { event: EventRecord; allEvents: EventRecord[]; onChange: (fn: (e: EventRecord) => EventRecord) => void; onAttendance: (id: string) => void; onReschedule: (id: string) => void }) {
  const [adding, setAdding] = useState(false); const [actionId, setActionId] = useState(""); const full = eventTypeRules[event.type].singleSchedule && event.schedules.length >= 1;
  return <section className="card"><div className="card-head"><div><h2><CalendarDays size={19} /> Schedule</h2><p>Participants remain attached when schedules change.</p></div><button className="btn primary" disabled={full} onClick={() => setAdding(true)}><Plus size={16} /> Add Schedule</button></div>
    {adding && <ScheduleEditor label="Save Schedule" onCancel={() => setAdding(false)} onSubmit={(d) => { const m = validateSchedule(event, d, "", allEvents); if (m) return m; const id = uid("schedule"); onChange((e) => ({ ...e, schedules: [...e.schedules, { id, ...d }], participants: e.participants.map((p) => ({ ...p, attendance: { ...p.attendance, [id]: { presence: "Not Marked", lateMinutes: 0, journal: "", note: "" } } })) })); setAdding(false); }} />}
    <div className="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Teacher</th><th>Room</th><th>Status</th><th>Actions</th></tr></thead><tbody>{event.schedules.map((s) => { const locked = !canReschedule(event, s); return <tr key={s.id}><td>{displayDate(s.date)}</td><td>{s.startTime}–{s.endTime}</td><td>{s.teacher}</td><td>{s.room}</td><td><span className={`badge ${locked ? "warning" : "info"}`}>{attendanceStarted(event, s.id) ? "Attendance Started" : scheduleStart(s) <= new Date() ? "Finished" : locked ? "Starting Soon" : "Upcoming"}</span></td>
      <td className="action-cell"><button className="icon-btn" onClick={() => setActionId(actionId === s.id ? "" : s.id)}><MoreHorizontal size={18} /></button>{actionId === s.id && <div className="dropdown"><button onClick={() => { setActionId(""); onAttendance(s.id); }}>View Attendance</button><button disabled={locked} onClick={() => { setActionId(""); onReschedule(s.id); }}>Reschedule</button><button className="danger-icon" disabled={attendanceStarted(event, s.id) || (event.active && event.schedules.length === 1)} onClick={() => { setActionId(""); onChange((e) => ({ ...e, schedules: e.schedules.filter((x) => x.id !== s.id), participants: e.participants.map((p) => { const a = { ...p.attendance }; delete a[s.id]; return { ...p, attendance: a }; }) })); }}>Cancel Schedule</button></div>}</td></tr>; })}
      {!event.schedules.length && <tr><td colSpan={6} className="empty-state">No schedules yet.</td></tr>}</tbody></table></div></section>;
}

function Participants({ event, onChange, onMove, onImport }: { event: EventRecord; onChange: (fn: (e: EventRecord) => EventRecord) => void; onMove: (id: string) => void; onImport: () => void }) {
  const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [adding, setAdding] = useState(false); const [name, setName] = useState(""); const [parent, setParent] = useState("");
  const rows = event.participants.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) && (!status || p.paymentStatus === status));
  const add = () => { if (!name.trim() || !parent.trim() || event.participants.length >= event.quota) return; const id = uid("STD"); onChange((e) => ({ ...e, participants: [...e.participants, { id, name: name.trim(), parent: parent.trim(), amountPaid: e.free ? 0 : e.price, paymentStatus: e.free ? "Free" : "Pending", attendance: Object.fromEntries(e.schedules.map((s) => [s.id, { presence: "Not Marked", lateMinutes: 0, journal: "", note: "" }])) }] })); setName(""); setParent(""); setAdding(false); };
  return <><div className="summary-grid three"><Summary title="Quota" value={`${event.participants.length}/${event.quota}`} icon={<UsersRound size={18} />} /><Summary title="Schedules" value={String(event.schedules.length)} icon={<CalendarDays size={18} />} /><Summary title="Ordering" value={event.studentOrderable ? "Enabled" : "Disabled"} icon={<UserRound size={18} />} /></div>
    <section className="card"><div className="card-head"><h2>Student List <span className="mini-count">{event.participants.length}</span></h2><div className="head-actions"><button className="btn outline" onClick={onImport}><Upload size={15} /> Import CSV</button><button className="btn outline" disabled={event.participants.length >= event.quota} onClick={() => setAdding(!adding)}><Plus size={15} /> Add Student</button></div></div>
      {adding && <div className="participant-editor"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student name" /><input value={parent} onChange={(e) => setParent(e.target.value)} placeholder="Parent name" /><button className="btn primary" disabled={!name.trim() || !parent.trim()} onClick={add}>Add Participant</button></div>}
      <div className="filters compact"><div className="search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Student" /></div><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All Status</option><option>Paid</option><option>Pending</option><option>Free</option></select></div>
      <div className="table-wrap"><table><thead><tr><th>Student</th><th>Parent</th><th>Payment</th><th>Paid</th><th>Actions</th></tr></thead><tbody>{rows.map((p) => <tr key={p.id}><td><b>{p.name}</b><small>{p.id}</small></td><td>{p.parent}</td><td><span className={`badge ${p.paymentStatus === "Pending" ? "warning" : "success"}`}>{p.paymentStatus}</span></td><td>{money(p.amountPaid)}</td><td><div className="row-actions"><button className="text-action" disabled={p.paymentStatus === "Pending"} title={p.paymentStatus === "Pending" ? "Complete the current payment before transferring." : ""} onClick={() => onMove(p.id)}>Move Event</button><button className="icon-btn danger-icon" onClick={() => onChange((e) => ({ ...e, participants: e.participants.filter((x) => x.id !== p.id) }))}><Trash2 size={15} /></button></div></td></tr>)}{!rows.length && <tr><td colSpan={5} className="empty-state">No participants match the filters.</td></tr>}</tbody></table></div></section></>;
}

function AttendanceList({ event, onOpen }: { event: EventRecord; onOpen: (id: string) => void }) {
  return <section className="card"><div className="card-head"><h2>Schedule Attendance</h2></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Present</th><th>Absent</th><th>Not Marked</th><th>Action</th></tr></thead><tbody>{event.schedules.map((s) => { const r = event.participants.map((p) => ensureAttendance(p, s.id)); return <tr key={s.id}><td>{displayDate(s.date)}</td><td>{s.startTime}–{s.endTime}</td><td>{r.filter((x) => x.presence === "Present").length}</td><td>{r.filter((x) => x.presence === "Absent").length}</td><td>{r.filter((x) => x.presence === "Not Marked").length}</td><td><button className="text-action" onClick={() => onOpen(s.id)}>See Details</button></td></tr>; })}</tbody></table></div></section>;
}
function Attendance({ event, schedule, onBack, onChange }: { event: EventRecord; schedule?: EventSchedule; onBack: () => void; onChange: (fn: (e: EventRecord) => EventRecord) => void }) {
  if (!schedule) return <><Header title="Attendance" back={onBack} /><div className="notice warning">No schedule available.</div></>;
  const patch = (id: string, data: Partial<AttendanceRecord>) => onChange((e) => ({ ...e, participants: e.participants.map((p) => p.id === id ? { ...p, attendance: { ...p.attendance, [schedule.id]: { ...ensureAttendance(p, schedule.id), ...data } } } : p) }));
  return <><Header title="Attendance Detail" subtitle={`${event.name} · ${displayDate(schedule.date)}`} back={onBack} /><section className="card compact-info"><div><small>Date</small><b>{displayDate(schedule.date)}</b></div><div><small>Time</small><b>{schedule.startTime}–{schedule.endTime}</b></div><div><small>Room</small><b>{schedule.room}</b></div><div><small>Teacher</small><b>{schedule.teacher}</b></div></section>
    <div className="summary-grid three"><Summary title="Room Name" value={schedule.room} icon={<BookOpen size={18} />} /><Summary title="Total Student" value={String(event.participants.length)} icon={<UsersRound size={18} />} /><Summary title="Total Teacher" value="1" icon={<UserRound size={18} />} /></div>
    <section className="card small-table"><div className="card-head"><h2>Teacher List <span className="mini-count">1 Teacher</span></h2></div><div className="table-wrap"><table><thead><tr><th>Teacher Name</th><th>Role</th><th>Attendance Status</th></tr></thead><tbody><tr><td><b>{schedule.teacher}</b></td><td>Main Teacher</td><td><span className="badge success">Assigned</span></td></tr></tbody></table></div></section>
    <section className="card"><div className="card-head"><h2>Student Attendance</h2><small>Changes save automatically.</small></div><div className="table-wrap"><table><thead><tr><th>Student</th><th>Presence</th><th>Late</th><th>Meeting Journal</th><th>Note</th></tr></thead><tbody>{event.participants.map((p) => { const r = ensureAttendance(p, schedule.id); return <tr key={p.id}><td><b>{p.name}</b><small>{p.id}</small></td><td><select value={r.presence} onChange={(e) => patch(p.id, { presence: e.target.value as AttendanceRecord["presence"] })}><option>Not Marked</option><option>Present</option><option>Absent</option></select></td><td><input type="number" min={0} value={r.lateMinutes} onChange={(e) => patch(p.id, { lateMinutes: Math.max(0, Number(e.target.value)) })} /></td><td><input value={r.journal} onChange={(e) => patch(p.id, { journal: e.target.value })} placeholder="Meeting journal" /></td><td><input value={r.note} onChange={(e) => patch(p.id, { note: e.target.value })} placeholder="Note" /></td></tr>; })}{!event.participants.length && <tr><td colSpan={5} className="empty-state">No participants.</td></tr>}</tbody></table></div></section></>;
}

function Reschedule({ event, allEvents, schedule, onClose, onSave }: { event: EventRecord; allEvents: EventRecord[]; schedule: EventSchedule; onClose: () => void; onSave: (s: EventSchedule) => void }) {
  const initial = { date: schedule.date, startTime: schedule.startTime, endTime: schedule.endTime, teacher: schedule.teacher, room: schedule.room };
  const [d, setD] = useState(initial); const [reason, setReason] = useState(""); const [notify, setNotify] = useState(true);
  const [error, setError] = useState(""); const [step, setStep] = useState<1 | 2>(1);
  const set = (k: keyof ScheduleDraft, v: string) => setD((x) => ({ ...x, [k]: v }));
  const unchanged = JSON.stringify(initial) === JSON.stringify(d);
  const next = () => { const m = validateSchedule(event, d, schedule.id, allEvents); if (m) setError(m); else setStep(2); };
  return <Modal onClose={onClose}><div className="modal-head"><div><h2>{step === 1 ? "Reschedule Event" : "Review Reschedule"}</h2><p>{event.name} · {displayDate(schedule.date)}</p></div><button className="icon-btn" onClick={onClose}><X /></button></div>
    <div className="stepper"><div className={`step ${step >= 1 ? "active" : ""}`}><span>{step > 1 ? <Check size={12} /> : 1}</span><b>1. New Schedule</b></div><div className={`step ${step === 2 ? "active" : ""}`}><span>2</span><b>2. Review</b></div></div>
    {step === 1 ? <><div className="notice success">Reschedule is available until two hours before start while attendance is empty.</div>
      <div className="form-two"><label>New Date<input type="date" value={d.date} onChange={(e) => set("date", e.target.value)} /></label><label>Room<select value={d.room} onChange={(e) => set("room", e.target.value)}>{rooms.map((x) => <option key={x}>{x}</option>)}</select></label></div>
      <div className="form-two"><label>Start Time<input type="time" value={d.startTime} onChange={(e) => set("startTime", e.target.value)} /></label><label>End Time<input type="time" value={d.endTime} onChange={(e) => set("endTime", e.target.value)} /></label></div>
      <label>Main Teacher<select value={d.teacher} onChange={(e) => set("teacher", e.target.value)}>{teachers.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>Reason for Reschedule<textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Tutor unavailable" /></label>
      {error && <div className="notice warning">{error}</div>}<div className="modal-foot"><button className="btn outline" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!reason.trim() || unchanged} onClick={next}>Continue to Review</button></div></>
      : <><div className="compare"><div><small>Current Schedule</small><h3>{displayDate(schedule.date)}</h3><p>{schedule.startTime}–{schedule.endTime}<br />{schedule.room}<br />{schedule.teacher}</p></div><span>→</span><div className="new"><small>New Schedule</small><h3>{displayDate(d.date)}</h3><p>{d.startTime}–{d.endTime}<br />{d.room}<br />{d.teacher}</p></div></div>
        <div className="notice success">{event.participants.length} participants will follow the new schedule. Existing orders and payments will not change.</div>
        <div className="read-card"><small>Reason</small><p>{reason}</p></div><label className="check-row"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Notify parents, students, and teacher.</label>
        <div className="modal-foot"><button className="btn outline" onClick={() => setStep(1)}>Back</button><button className="btn primary" onClick={() => onSave({ id: schedule.id, ...d })}>Confirm Reschedule</button></div></>}
  </Modal>;
}

function Transfer({ source, participant, events, onClose, onConfirm }: { source: EventRecord; participant: Participant; events: EventRecord[]; onClose: () => void; onConfirm: (id: string) => void }) {
  const [eligibleIds] = useState(() => events.filter((e) => e.id !== source.id && e.type === source.type && e.active && e.participants.length < e.quota && e.schedules.some((s) => scheduleStart(s) > new Date()) && !e.participants.some((p) => p.id === participant.id)).map((e) => e.id));
  const eligible = events.filter((e) => eligibleIds.includes(e.id));
  const [id, setId] = useState(eligible[0]?.id || ""); const [reviewed, setReviewed] = useState(false);
  const [originalPaid] = useState(participant.amountPaid);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); const [reason, setReason] = useState("Schedule conflict"); const [note, setNote] = useState("");
  const dest = eligible.find((e) => e.id === id); const delta = dest ? dest.price - originalPaid : 0;
  const destinationSchedule = dest?.schedules.filter((s) => scheduleStart(s) > new Date()).sort((a, b) => scheduleStart(a).getTime() - scheduleStart(b).getTime())[0];
  if (step === 4 && dest) return <Modal onClose={onClose}><div className="transfer-content"><div className="success-view"><div className="success-icon"><Check /></div><h2>Participant successfully moved</h2><p>{participant.name} has been moved to {dest.name}.</p>
    <div className="result-grid"><div><small>Destination Event</small><b>{dest.name}</b><small>New Schedule</small><b>{destinationSchedule ? `${displayDate(destinationSchedule.date)}, ${destinationSchedule.startTime}–${destinationSchedule.endTime}` : "—"}</b><small>Room</small><b>{destinationSchedule?.room || "—"}</b></div>
      <div><small>Price Adjustment</small><b>{delta > 0 ? `Additional Invoice ${money(delta)}` : delta < 0 ? `Balance Credit ${money(-delta)}` : "No price difference"}</b><small>Status</small><span className={`badge ${delta > 0 ? "warning" : "success"}`}>{delta > 0 ? "Pending Payment" : "Completed"}</span></div></div>
    <div className="notice success">{delta > 0 ? "The transfer is complete and an additional invoice was created." : delta < 0 ? "The transfer is complete and customer balance was added." : "The transfer is complete with no additional payment."}</div>
    <button className="btn primary" onClick={onClose}>Back to Participants</button></div></div></Modal>;
  return <Modal onClose={onClose}><div className="transfer-content"><div className="modal-head"><div><h2>Move Participant</h2><p>{step === 1 ? "Select a destination event." : step === 2 ? "Review the price adjustment." : "Review the participant transfer."}</p></div><button className="icon-btn" onClick={onClose}><X /></button></div>
    <div className="stepper">{["Select Event", "Price Adjustment", "Review"].map((label, index) => <div key={label} className={`step ${step >= index + 1 ? "active" : ""}`}><span>{step > index + 1 ? <Check size={12} /> : index + 1}</span><b>{index + 1}. {label}</b></div>)}</div>
    <section className="read-card"><div className="compact-info"><div><small>Student</small><b>{participant.name}</b></div><div><small>Current Event</small><b>{source.name}</b></div><div><small>Amount Paid</small><b>{money(originalPaid)}</b></div><div><small>Payment</small><b>{participant.paymentStatus}</b></div></div></section>
    {!eligible.length ? <div className="notice warning">No eligible destination event is available.</div> : step === 1 ? <>
      <div className="notice neutral">Only matching event types with a future schedule, available quota, and no duplicate student are shown.</div>
      <div className="table-wrap"><table><thead><tr><th>Select</th><th>Event</th><th>Date & Time</th><th>Quota</th><th>Price</th></tr></thead><tbody>{eligible.map((event) => { const schedule = event.schedules.find((s) => scheduleStart(s) > new Date()); return <tr key={event.id} className={id === event.id ? "selected-row" : ""} onClick={() => setId(event.id)}><td><input type="radio" checked={id === event.id} readOnly /></td><td><b>{event.name}</b><small>{schedule?.room}</small></td><td>{schedule ? displayDate(schedule.date) : "—"}<small>{schedule ? `${schedule.startTime}–${schedule.endTime}` : ""}</small></td><td>{event.quota - event.participants.length} seats</td><td>{money(event.price)}</td></tr>; })}</tbody></table></div>
      <div className="modal-foot"><button className="btn outline" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!dest} onClick={() => setStep(2)}>Continue</button></div></>
      : step === 2 && dest ? <><div className="price-lines"><div><span>Amount Already Paid</span><b>{money(originalPaid)}</b></div><div><span>Destination Event Price</span><b>{money(dest.price)}</b></div><div className={delta > 0 ? "attention" : "positive"}><b>{delta > 0 ? "Additional Invoice" : delta < 0 ? "Balance Credit" : "Price Difference"}</b><b>{money(Math.abs(delta))}</b></div></div>
        <div className={`notice ${delta > 0 ? "warning" : "success"}`}>{delta > 0 ? "Only the price difference will be invoiced." : delta < 0 ? "The difference will be added to customer balance." : "No additional payment is required."}</div>
        <label>Reason for Transfer<select value={reason} onChange={(e) => setReason(e.target.value)}><option>Schedule conflict</option><option>Student unavailable</option><option>Other</option></select></label><label>Internal Note<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional internal note" /></label>
        <div className="modal-foot"><button className="btn outline" onClick={() => setStep(1)}>Back</button><button className="btn primary" onClick={() => setStep(3)}>Continue to Review</button></div></>
      : step === 3 && dest ? <><div className="compare"><div><small>From</small><h3>{source.name}</h3><p>{money(originalPaid)}</p></div><span>→</span><div className="new"><small>To</small><h3>{dest.name}</h3><p>{destinationSchedule ? `${displayDate(destinationSchedule.date)} · ${destinationSchedule.startTime}–${destinationSchedule.endTime}` : "—"}</p></div></div>
        <div className="price-lines"><div><span>Destination Price</span><b>{money(dest.price)}</b></div><div><span>{delta > 0 ? "Additional Invoice" : delta < 0 ? "Balance Credit" : "Price Difference"}</span><b>{money(Math.abs(delta))}</b></div><div><span>Reason</span><b>{reason}</b></div></div>
        <label className="check-row"><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} /> I reviewed the destination, quota, schedule, and payment adjustment.</label>
        <div className="modal-foot"><button className="btn outline" onClick={() => setStep(2)}>Back</button><button className="btn primary" disabled={!reviewed} onClick={() => { onConfirm(id); setStep(4); }}>{delta > 0 ? "Confirm Transfer & Create Invoice" : delta < 0 ? "Confirm Transfer & Add Balance" : "Confirm Transfer"}</button></div></> : null}
  </div></Modal>;
}
function transferParticipant(events: EventRecord[], setEvents: React.Dispatch<React.SetStateAction<EventRecord[]>>, sourceId: string, destId: string, participantId: string) {
  const source = events.find((e) => e.id === sourceId)!, dest = events.find((e) => e.id === destId)!, p = source.participants.find((x) => x.id === participantId)!, delta = dest.price - p.amountPaid;
  setEvents((all) => all.map((e) => e.id === sourceId ? { ...e, participants: e.participants.filter((x) => x.id !== participantId) } : e.id === destId ? { ...e,
    participants: [...e.participants, { ...p, amountPaid: delta > 0 ? p.amountPaid : dest.price, paymentStatus: delta > 0 ? "Pending" : dest.free ? "Free" : "Paid", attendance: Object.fromEntries(e.schedules.map((s) => [s.id, { presence: "Not Marked", lateMinutes: 0, journal: "", note: "" }])) }],
    finance: delta === 0 ? e.finance : [...e.finance, { id: uid("finance"), participantName: p.name, kind: delta > 0 ? "Additional Invoice" : "Balance Credit", amount: Math.abs(delta), status: delta > 0 ? "Pending Payment" : "Completed", createdAt: new Date().toISOString() }] } : e));
}

function ImportParticipants({ event, onClose, onImport }: { event: EventRecord; onClose: () => void; onImport: (p: Participant[]) => void }) {
  const [text, setText] = useState("name,parent,amountPaid\n"); const [error, setError] = useState(""); const remaining = event.quota - event.participants.length;
  const parse = () => { const lines = text.trim().split(/\r?\n/).slice(1).filter(Boolean), out: Participant[] = []; for (const line of lines) { const [name, parent, amountRaw] = line.split(",").map((x) => x.trim()); if (!name || !parent) return setError(`Invalid row: ${line}`); if (event.participants.some((p) => p.name.toLowerCase() === name.toLowerCase()) || out.some((p) => p.name.toLowerCase() === name.toLowerCase())) return setError(`Duplicate participant: ${name}`); const amount = event.free ? 0 : Number(amountRaw || event.price); if (!Number.isFinite(amount) || amount < 0) return setError(`Invalid amount: ${name}`); out.push({ id: uid("STD"), name, parent, amountPaid: amount, paymentStatus: event.free ? "Free" : amount >= event.price ? "Paid" : "Pending", attendance: Object.fromEntries(event.schedules.map((s) => [s.id, { presence: "Not Marked", lateMinutes: 0, journal: "", note: "" }])) }); } if (!out.length) return setError("Add at least one row."); if (out.length > remaining) return setError(`Only ${remaining} quota slots remain.`); onImport(out); };
  return <Modal onClose={onClose}><div className="modal-head"><div><h2>Import Participants</h2><p>{remaining} quota slots remaining</p></div><button className="icon-btn" onClick={onClose}><X /></button></div><div className="notice blue"><FileSpreadsheet size={17} /> CSV: name,parent,amountPaid</div><input aria-label="CSV file" type="file" accept=".csv" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} /><label>CSV Preview<textarea className="csv-area" value={text} onChange={(e) => setText(e.target.value)} /></label>{error && <div className="notice warning"><AlertCircle size={17} /> {error}</div>}<div className="modal-foot"><button className="btn outline" onClick={onClose}>Cancel</button><button className="btn primary" onClick={parse}>Validate & Import</button></div></Modal>;
}

function CreateEvent({ allEvents, onCancel, onSave }: { allEvents: EventRecord[]; onCancel: () => void; onSave: (e: EventRecord) => void }) {
  const [type, setType] = useState<EventType>("Workshop"), [name, setName] = useState(""), [book, setBook] = useState("Workshop Learning Book"), [language, setLanguage] = useState("English"), [free, setFree] = useState(false), [price, setPrice] = useState(350000), [quota, setQuota] = useState(20), [schedules, setSchedules] = useState<EventSchedule[]>([]), [adding, setAdding] = useState(true);
  const rule = eventTypeRules[type]; const draft: EventRecord = { id: "draft", name, type, branch: "HQ Training", book, language, price: free ? 0 : price, free, studentOrderable: rule.studentOrderable, quota, active: true, schedules, participants: [], finance: [], createdAt: new Date().toISOString() };
  const defaultPrice: Record<EventType, number> = { Workshop: 350000, Trial: 150000, Bootcamp: 1500000, PTM: 0, "Internal Meeting": 0 };
  const changeType = (t: EventType) => {
    setType(t);
    if (eventTypeRules[t].singleSchedule) setSchedules((s) => s.slice(0, 1));
    if (t === "Internal Meeting") {
      setFree(true); setPrice(0); setBook("Internal Meeting Agenda"); setLanguage("Indonesian");
    } else {
      setFree(t === "PTM"); setPrice(defaultPrice[t]);
      if (t === "Trial") setBook("All Courses — Trial");
      if (t === "Workshop") setBook("Workshop Learning Book");
      if (t === "Bootcamp") setBook("Bootcamp Learning Book");
      if (t === "PTM") { setBook("Mentoring Handbook"); setLanguage("Indonesian"); }
    }
  };
  return <><Header title="Create Event" subtitle="Type rules are enforced automatically." back={onCancel} actions={<><button className="btn outline" onClick={onCancel}>Discard</button><button className="btn primary" disabled={!name.trim() || !schedules.length} onClick={() => onSave({ ...draft, id: uid("event"), name: name.trim() })}><Check size={16} /> Save Event</button></>} />
    <div className="create-grid"><div><section className="card form-card"><div className="card-head"><h2><BookOpen size={18} /> Basic Information</h2></div><label>Event Type<select value={type} onChange={(e) => changeType(e.target.value as EventType)}>{Object.keys(eventTypeRules).map((x) => <option key={x}>{x}</option>)}</select></label><label>Event Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder={rule.placeholder} /></label><div className="form-two"><label>Book<input value={book} onChange={(e) => setBook(e.target.value)} /></label><label>Language<select value={language} onChange={(e) => setLanguage(e.target.value)}><option>English</option><option>Indonesian</option></select></label></div>
      {rule.studentOrderable ? <><button className="toggle-row toggle-button" onClick={() => setFree(!free)}><b>Free Event</b><Toggle on={free} /></button><div className="form-two"><label>Price<input type="number" min={0} disabled={free} value={free ? 0 : price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))} /></label><label>Quota<input type="number" min={1} value={quota} onChange={(e) => setQuota(Math.max(1, Number(e.target.value)))} /></label></div></> : <div className="notice neutral">Internal Meeting cannot be ordered by students.</div>}</section>
      <section className="card"><div className="card-head"><div><h2><CalendarDays size={18} /> Schedule</h2><p>{rule.singleSchedule ? `${type} requires exactly one schedule.` : `${type} supports one or more schedules.`}</p></div>{!adding && <button className="btn primary" disabled={rule.singleSchedule && schedules.length >= 1} onClick={() => setAdding(true)}><Plus size={15} /> Add Schedule</button>}</div>{adding && <ScheduleEditor label="Save Schedule" onCancel={() => setAdding(false)} onSubmit={(d) => { const m = validateSchedule(draft, d, "", allEvents); if (m) return m; setSchedules((s) => [...s, { id: uid("schedule"), ...d }]); setAdding(false); }} />}
      <div className="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Teacher</th><th>Room</th><th>Action</th></tr></thead><tbody>{schedules.map((s) => <tr key={s.id}><td>{displayDate(s.date)}</td><td>{s.startTime}–{s.endTime}</td><td>{s.teacher}</td><td>{s.room}</td><td><button className="icon-btn danger-icon" onClick={() => setSchedules((all) => all.filter((x) => x.id !== s.id))}><Trash2 size={15} /></button></td></tr>)}{!schedules.length && <tr><td colSpan={5} className="empty-state">Add at least one schedule.</td></tr>}</tbody></table></div></section></div>
      <section className="card settings-card"><div className="card-head"><h2><Settings size={18} /> Rules</h2></div><div className="detail-row"><span>Schedule</span><b>{rule.singleSchedule ? "One only" : "Multiple"}</b></div><div className="detail-row"><span>Student ordering</span><b>{rule.studentOrderable ? "Available" : "Disabled"}</b></div></section></div></>;
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) { return <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal">{children}</div></div>; }
function Summary({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) { return <section className="card summary"><div><small>{title}</small><b>{value}</b></div><span>{icon}</span></section>; }
function Toggle({ on }: { on: boolean }) { return <span className={`toggle ${on ? "on" : ""}`}><i /></span>; }