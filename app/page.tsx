"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  FileSpreadsheet,
  LayoutDashboard,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Screen = "events" | "detail" | "create" | "attendance";
type DetailTab = "details" | "participants" | "attendance" | "schedule";
type EventType = "Workshop" | "Trial" | "Bootcamp" | "PTM" | "Internal Meeting";
type TransferStep = 0 | 1 | 2 | 3 | 4;
type PriceCase = "same" | "higher" | "lower";

type EventSchedule = {
  date: string;
  isoDate: string;
  startTime: string;
  endTime: string;
  teacher: string;
  room: string;
  locked: boolean;
  attendanceStarted: boolean;
};

type Participant = {
  name: string;
  id: string;
  parent: string;
  payment: string;
  amount: string;
};

const digitalSchedules: EventSchedule[] = [
  { date: "28 Sep 2026", isoDate: "2026-09-28", startTime: "13:00", endTime: "15:00", teacher: "Nimas Sekararum Kinanthi", room: "Bill Gates Room", locked: true, attendanceStarted: true },
  { date: "5 Oct 2026", isoDate: "2026-10-05", startTime: "13:00", endTime: "15:00", teacher: "Nimas Sekararum Kinanthi", room: "Bill Gates Room", locked: false, attendanceStarted: false },
  { date: "12 Oct 2026", isoDate: "2026-10-12", startTime: "13:00", endTime: "15:00", teacher: "Budi Wicaksono", room: "Steve Jobs Room", locked: false, attendanceStarted: false },
];

const initialSchedulesByEvent: Record<string, EventSchedule[]> = {
  "Digital Literacy Workshop": digitalSchedules,
  "Trial Robotics": [digitalSchedules[1]],
  "Holiday Coding Bootcamp": [digitalSchedules[1], digitalSchedules[2]],
  "PTM Grade 5": [digitalSchedules[2]],
  "Monthly Teacher Meeting": [digitalSchedules[1], digitalSchedules[2]],
  "Trial Class — FREE": [digitalSchedules[0]],
};

const initialParticipants: Participant[] = [
  { name: "Axel Mikhail Ahmad", id: "STD-20260818-4080", parent: "Axel Mikhail", payment: "Paid", amount: "IDR 350,000" },
  { name: "Bella Natasha Putri", id: "STD-20260818-4081", parent: "Sari Indah", payment: "Paid", amount: "IDR 350,000" },
  { name: "Kevin Pratama", id: "STD-20260818-4082", parent: "Rina Pratama", payment: "Pending", amount: "IDR 350,000" },
];

const destinationEvents = [
  { id: "same", name: "Digital Literacy Workshop — Session 2", date: "5 Oct 2026", time: "13:00–15:00", room: "Bill Gates Room", quota: "1 seat left", price: 350000 },
  { id: "higher", name: "Advanced Digital Workshop", date: "12 Oct 2026", time: "13:00–15:00", room: "Steve Jobs Room", quota: "7 seats left", price: 500000 },
  { id: "lower", name: "Intro to Digital Art", date: "19 Oct 2026", time: "10:00–12:00", room: "Osaka Room", quota: "8 seats left", price: 250000 },
] as const;

const initialEventRows = [
  ["Digital Literacy Workshop", "Workshop", "3 schedules", "24", "IDR 350,000", "Active"],
  ["Trial Robotics", "Trial", "28 Sep 2026, 13:00", "8", "IDR 150,000", "Active"],
  ["Holiday Coding Bootcamp", "Bootcamp", "6 schedules", "16", "IDR 1,500,000", "Active"],
  ["PTM Grade 5", "PTM", "30 Sep 2026, 10:00", "12", "Free", "Active"],
  ["Monthly Teacher Meeting", "Internal Meeting", "2 schedules", "10", "—", "Active"],
  ["Trial Class — FREE", "Trial", "22 Aug 2026, 12:00", "1", "IDR 0", "Inactive"],
];

function money(value: number) {
  return `IDR ${value.toLocaleString("en-US")}`;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("events");
  const [selectedEventName, setSelectedEventName] = useState("Digital Literacy Workshop");
  const [detailTab, setDetailTab] = useState<DetailTab>("schedule");
  const [rescheduleStep, setRescheduleStep] = useState<0 | 1 | 2 | 3>(0);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  const [transferStep, setTransferStep] = useState<TransferStep>(0);
  const [priceCase, setPriceCase] = useState<PriceCase>("same");
  const [reviewed, setReviewed] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [eventType, setEventType] = useState<EventType>("Workshop");
  const [schedulesByEvent, setSchedulesByEvent] = useState<Record<string, EventSchedule[]>>(initialSchedulesByEvent);
  const [rescheduleIndex, setRescheduleIndex] = useState<number | null>(null);
  const [eventRows, setEventRows] = useState(initialEventRows);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("timedoor-event-revamp-state");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.eventRows)) setEventRows(parsed.eventRows);
        if (parsed.schedulesByEvent) setSchedulesByEvent(parsed.schedulesByEvent);
        if (Array.isArray(parsed.participants)) setParticipants(parsed.participants);
      }
    } finally {
      hydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem("timedoor-event-revamp-state", JSON.stringify({ eventRows, schedulesByEvent, participants }));
  }, [eventRows, schedulesByEvent, participants]);

  const destination = useMemo(
    () => destinationEvents.find((e) => e.id === priceCase)!,
    [priceCase],
  );

  function openDetail(tab: DetailTab = "schedule", eventName = selectedEventName) {
    setSelectedEventName(eventName);
    setScreen("detail");
    setDetailTab(tab);
    setActionMenu(null);
  }

  return (
    <div className="app-shell">
      <Sidebar screen={screen} setScreen={setScreen} openDetail={openDetail} />
      <main className="main">
        <Topbar />
        <div className="content">
          {screen === "events" && (
            <EventsPage
              rows={eventRows}
              onCreate={() => setScreen("create")}
              onOpen={(name) => openDetail("schedule", name)}
            />
          )}
          {screen === "detail" && (
            <DetailPage
              tab={detailTab}
              setTab={setDetailTab}
              onBack={() => setScreen("events")}
              eventName={selectedEventName}
              eventType={(eventRows.find((row) => row[0] === selectedEventName)?.[1] ?? "Workshop") as EventType}
              actionMenu={actionMenu}
              setActionMenu={setActionMenu}
              schedules={schedulesByEvent[selectedEventName] ?? []}
              participants={participants}
              onAddParticipant={(participant) => setParticipants((current) => [...current, participant])}
              onAddSchedule={(schedule) => setSchedulesByEvent((current) => ({
                ...current,
                [selectedEventName]: [...(current[selectedEventName] ?? []), schedule],
              }))}
              onReschedule={(index) => {
                setRescheduleIndex(index);
                setRescheduleStep(1);
              }}
              onAttendance={() => setScreen("attendance")}
              onMove={() => {
                setReviewed(false);
                setTransferStep(1);
              }}
              onImport={() => setImportOpen(true)}
            />
          )}
          {screen === "create" && (
            <CreateEventPage
              eventType={eventType}
              setEventType={setEventType}
              onBack={() => setScreen("events")}
              onSave={(row, schedules) => {
                setEventRows((current) => [row, ...current]);
                setSchedulesByEvent((current) => ({ ...current, [row[0]]: schedules }));
                setScreen("events");
              }}
            />
          )}
          {screen === "attendance" && <AttendancePage onBack={() => openDetail("schedule")} />}
        </div>
      </main>

      {rescheduleStep > 0 && (
        <RescheduleModal
          step={rescheduleStep}
          setStep={setRescheduleStep}
          schedule={rescheduleIndex === null ? null : schedulesByEvent[selectedEventName]?.[rescheduleIndex] ?? null}
          onConfirm={(updated) => {
            if (rescheduleIndex !== null) {
              setSchedulesByEvent((current) => ({
                ...current,
                [selectedEventName]: (current[selectedEventName] ?? []).map((item, index) => index === rescheduleIndex ? updated : item),
              }));
            }
          }}
        />
      )}
      {transferStep > 0 && (
        <TransferFlow
          step={transferStep}
          setStep={setTransferStep}
          priceCase={priceCase}
          setPriceCase={setPriceCase}
          destination={destination}
          reviewed={reviewed}
          setReviewed={setReviewed}
          onTransferred={() => setParticipants((current) => current.filter((participant) => participant.id !== "STD-20260818-4080"))}
        />
      )}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </div>
  );
}

function Sidebar({
  screen,
  setScreen,
  openDetail,
}: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  openDetail: (tab?: DetailTab) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-mark">↗</span>
        <span>timedoor<br /><b>academy</b></span>
      </div>
      <button className="nav-row" onClick={() => setScreen("events")}><LayoutDashboard size={17} /> Dashboard</button>
      <div className="nav-label">MENU</div>
      <button className="nav-row"><span>◔</span> Analytic</button>
      <button className="nav-row"><span>▤</span> Accounting</button>
      <button className="nav-row parent"><span>▣</span> Product <ChevronDown size={15} /></button>
      <div className="subnav">
        <button>○ Package</button>
        <button className={screen !== "attendance" ? "active" : ""} onClick={() => setScreen("events")}>● Event</button>
        <button>○ Trial</button>
        <button>○ Learning Path</button>
        <button>○ Add Ons</button>
        <button>○ Item</button>
      </div>
      <button className="nav-row"><UserRound size={17} /> Customer</button>
      <button className="nav-row"><BookOpen size={17} /> Class</button>
      <button className="nav-row"><UsersRound size={17} /> Teacher</button>
      <button className="nav-row"><span>✓</span> Approval <span className="count">59</span></button>
      <div className="nav-label">CURRICULUM</div>
      <button className="nav-row">▣ Question Bank</button>
      <button className="nav-row">&lt;/&gt; Code Playground</button>
      <button className="nav-row">▤ Test</button>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <div />
      <div className="top-actions">
        <div className="branch"><small>Branch Availability</small><span>HQ Training <ChevronDown size={13} /></span></div>
        <button className="top-select">Asia/Jakarta <ChevronDown size={14} /></button>
        <button className="icon-btn">☼</button>
        <button className="icon-btn notification">♧<span>1</span></button>
        <div className="avatar">T<i /></div>
      </div>
    </header>
  );
}

function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: string;
  subtitle?: string;
  back?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="page-title-wrap">
        {back && <button className="back-btn" onClick={back}><ArrowLeft size={20} /></button>}
        <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </div>
  );
}

function EventsPage({ rows, onCreate, onOpen }: { rows: string[][]; onCreate: () => void; onOpen: (name: string) => void }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const visibleRows = useMemo(() => {
    const filtered = rows.filter((row) =>
      row[0].toLowerCase().includes(search.toLowerCase()) &&
      (!typeFilter || row[1] === typeFilter),
    );
    return sortOrder === "name" ? [...filtered].sort((a, b) => a[0].localeCompare(b[0])) : filtered;
  }, [rows, search, typeFilter, sortOrder]);
  return (
    <>
      <PageHeader
        title="Event"
        subtitle="Manages & find all about academy event data"
        actions={<button className="btn primary" onClick={onCreate}><Plus size={16} /> Create Event</button>}
      />
      <section className="card list-card">
        <div className="filters">
          <div className="search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Event" /></div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="">Select Event Type</option><option>Workshop</option><option>Trial</option><option>Bootcamp</option><option>PTM</option><option>Internal Meeting</option></select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}><option value="newest">Newest</option><option value="name">Name A–Z</option></select>
          <button className="text-action" onClick={() => { setSearch(""); setTypeFilter(""); setSortOrder("newest"); }}>Reset Filter</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Event Name</th><th>Event Type</th><th>Schedule</th><th>Participants</th><th>Price</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {visibleRows.map((r) => {
                return (
                <tr key={r[0]} onClick={() => onOpen(r[0])} className="clickable">
                  <td className="green-link">{r[0]}</td>
                  <td><span className="type-badge">{r[1]}</span></td>
                  <td>{r[2]}</td><td>{r[3]} participants</td><td>{r[4]}</td>
                  <td><span className={`badge ${r[5] === "Active" ? "success" : "neutral"}`}>{r[5]}</span></td>
                  <td><button className="icon-btn"><MoreHorizontal size={18} /></button></td>
                </tr>
              )})}
              {visibleRows.length === 0 && <tr><td colSpan={7} className="empty-state">No events match the current filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <TableFooter total="1–6 of 47" />
      </section>
    </>
  );
}

function DetailPage({
  tab, setTab, onBack, eventName, eventType, actionMenu, setActionMenu, schedules, participants, onAddParticipant, onAddSchedule, onReschedule, onAttendance, onMove, onImport,
}: {
  tab: DetailTab;
  setTab: (t: DetailTab) => void;
  onBack: () => void;
  eventName: string;
  eventType: EventType;
  actionMenu: number | null;
  setActionMenu: (n: number | null) => void;
  schedules: EventSchedule[];
  participants: Participant[];
  onAddParticipant: (participant: Participant) => void;
  onAddSchedule: (schedule: EventSchedule) => void;
  onReschedule: (index: number) => void;
  onAttendance: () => void;
  onMove: () => void;
  onImport: () => void;
}) {
  return (
    <>
      <PageHeader title="Detail Event" subtitle={eventName} back={onBack} />
      <div className="tabs">
        {(["details", "participants", "attendance", "schedule"] as DetailTab[]).map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      {tab === "schedule" && (
        <ScheduleTab eventType={eventType} schedules={schedules} actionMenu={actionMenu} setActionMenu={setActionMenu} onAddSchedule={onAddSchedule} onReschedule={onReschedule} onAttendance={onAttendance} />
      )}
      {tab === "participants" && <ParticipantsTab participants={participants} onAddParticipant={onAddParticipant} onMove={onMove} onImport={onImport} />}
      {tab === "attendance" && <AttendanceList onOpen={onAttendance} />}
      {tab === "details" && <DetailsTab eventName={eventName} eventType={eventType} />}
    </>
  );
}

function ScheduleTab({
  eventType, schedules, actionMenu, setActionMenu, onAddSchedule, onReschedule, onAttendance,
}: {
  eventType: EventType;
  schedules: EventSchedule[];
  actionMenu: number | null;
  setActionMenu: (n: number | null) => void;
  onAddSchedule: (schedule: EventSchedule) => void;
  onReschedule: (index: number) => void;
  onAttendance: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState("2026-11-02");
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("15:00");
  const [teacher, setTeacher] = useState("Nimas Sekararum Kinanthi");
  const [room, setRoom] = useState("Bill Gates Room");
  const [error, setError] = useState("");
  const single = eventType === "Trial" || eventType === "PTM";
  function addSchedule() {
    if (single && schedules.length >= 1) return setError(`${eventType} supports one schedule only.`);
    if (endTime <= startTime) return setError("End time must be later than start time.");
    if (schedules.some((item) => item.isoDate === date && item.startTime === startTime && item.endTime === endTime && item.room === room)) return setError("This schedule already exists.");
    onAddSchedule({ date: displayDate(date), isoDate: date, startTime, endTime, teacher, room, locked: false, attendanceStarted: false });
    setAdding(false);
    setError("");
  }
  return (
    <section className="card">
      <div className="card-head">
        <div><h2><CalendarDays size={19} /> Schedule</h2><p>Manage dates, teachers, and rooms for this event.</p></div>
        <div className="head-actions"><small>{single ? `${eventType} supports one schedule only.` : `${eventType} supports multiple schedules.`}</small><button className="btn primary" disabled={single && schedules.length >= 1} onClick={() => setAdding((value) => !value)}><Plus size={16} /> Add Schedule</button></div>
      </div>
      {adding && <div className="schedule-editor"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /><select value={teacher} onChange={(e) => setTeacher(e.target.value)}><option>Nimas Sekararum Kinanthi</option><option>Budi Wicaksono</option></select><select value={room} onChange={(e) => setRoom(e.target.value)}><option>Bill Gates Room</option><option>Steve Jobs Room</option><option>Jeff Bezos Room</option></select><button className="btn primary" onClick={addSchedule}>Save Schedule</button></div>}
      {error && <div className="notice warning">{error}</div>}
      <table>
        <thead><tr><th>Date</th><th>Time</th><th>Main Teacher</th><th>Room</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {schedules.map((s, i) => (
            <tr key={s.date}>
              <td>{s.date}</td><td>{s.startTime}–{s.endTime}</td><td>{s.teacher}</td><td>{s.room}</td>
              <td><span className={`badge ${s.locked ? "warning" : "info"}`}>{s.locked ? "Starting Soon" : "Upcoming"}</span></td>
              <td className="action-cell">
                <button className="icon-btn" onClick={() => setActionMenu(actionMenu === i ? null : i)}><MoreHorizontal size={18} /></button>
                {actionMenu === i && (
                  <div className="dropdown">
                    <button onClick={() => { setActionMenu(null); onAttendance(); }}>View Attendance</button>
                    {s.locked || s.attendanceStarted ? (
                      <button className="disabled" title="Reschedule is unavailable after attendance starts or less than 2 hours before start"><LockKeyhole size={14} /><span>Reschedule<small>{s.attendanceStarted ? "Attendance has started" : "Cutoff has passed"}</small></span></button>
                    ) : (
                      <button onClick={() => { setActionMenu(null); onReschedule(i); }}>Reschedule</button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <TableFooter total="1–3 of 3" />
    </section>
  );
}

function ParticipantsTab({ participants, onAddParticipant, onMove, onImport }: { participants: Participant[]; onAddParticipant: (participant: Participant) => void; onMove: () => void; onImport: () => void }) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const filtered = participants.filter((participant) => participant.name.toLowerCase().includes(search.toLowerCase()));
  function addParticipant() {
    if (!name.trim() || !parent.trim()) return;
    onAddParticipant({
      name: name.trim(),
      parent: parent.trim(),
      id: `STD-${Date.now()}`,
      payment: "Pending",
      amount: "IDR 350,000",
    });
    setName("");
    setParent("");
    setAdding(false);
  }
  return (
    <>
      <div className="summary-grid three">
        <Summary title="Room Name" value="Bill Gates Room" icon={<BookOpen size={18} />} />
        <Summary title="Total Student" value={String(participants.length)} icon={<UsersRound size={18} />} />
        <Summary title="Total Teacher" value="1" icon={<UserRound size={18} />} />
      </div>
      <section className="card">
        <div className="card-head">
          <div><h2>Student List <span className="mini-count">{participants.length} Students</span></h2></div>
          <div className="head-actions">
            <button className="btn outline" onClick={onImport}><Upload size={15} /> Import Participants</button>
            <button className="btn outline" onClick={() => setAdding((value) => !value)}><Plus size={15} /> Add Student</button>
          </div>
        </div>
        {adding && <div className="participant-editor"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student name" /><input value={parent} onChange={(e) => setParent(e.target.value)} placeholder="Parent name" /><button className="btn primary" disabled={!name.trim() || !parent.trim()} onClick={addParticipant}>Add Participant</button></div>}
        <div className="filters compact"><div className="search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Student" /></div><select><option>All Status</option><option>Paid</option><option>Pending</option></select></div>
        <table>
          <thead><tr><th>Student</th><th>Parent</th><th>Payment</th><th>Amount Paid</th><th>Action</th></tr></thead>
          <tbody>{filtered.map((participant) => <tr key={participant.id}><td><b>{participant.name}</b><small>{participant.id}</small></td><td>{participant.parent}</td><td><span className={`badge ${participant.payment === "Paid" ? "success" : "warning"}`}>{participant.payment}</span></td><td>{participant.amount}</td><td>{participant.id === "STD-20260818-4080" ? <button className="text-action" onClick={onMove}>Move to Another Event</button> : <button className="icon-btn"><MoreHorizontal size={17} /></button>}</td></tr>)}</tbody>
        </table>
        <TableFooter total={participants.length ? `1–${filtered.length} of ${participants.length}` : "0 of 0"} />
      </section>
    </>
  );
}

function AttendanceList({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="card">
      <div className="card-head"><div><h2>List Schedule</h2></div></div>
      <div className="filters"><input type="date" /><button className="btn primary">Filter</button><button className="text-action">Reset Filter</button></div>
      <table><thead><tr><th>Date</th><th>Time</th><th>Room</th><th>Attend</th><th>Absent</th><th>Action</th></tr></thead>
        <tbody><tr><td>28 Sep 2026 <span className="badge info">Ongoing</span></td><td>13:00–15:00</td><td>Bill Gates Room</td><td>8</td><td>1</td><td><button className="text-action" onClick={onOpen}>See Details</button></td></tr></tbody>
      </table>
    </section>
  );
}

function DetailsTab({ eventName, eventType }: { eventName: string; eventType: EventType }) {
  return (
    <div className="detail-grid">
      <section className="card"><div className="card-head"><h2>Basic Information</h2></div>{[`Product ID|EV-${eventName.length}0926`,`Branch Availability|HQ Training`,`Event Name|${eventName}`,`Event Type|${eventType}`,"Base Price|IDR 350,000"].map(x => { const [a,b]=x.split("|"); return <div className="detail-row" key={a}><span>{a}</span><b>{b}</b></div>; })}</section>
      <section className="card"><div className="card-head"><h2>Settings</h2></div><span className="badge success">Active</span><p className="muted">Created at<br />24 Sep 2026</p></section>
    </div>
  );
}

function CreateEventPage({
  eventType,
  setEventType,
  onBack,
  onSave,
}: {
  eventType: EventType;
  setEventType: (e: EventType) => void;
  onBack: () => void;
  onSave: (row: string[], schedules: EventSchedule[]) => void;
}) {
  const single = eventType === "Trial" || eventType === "PTM";
  const internal = eventType === "Internal Meeting";
  const [eventName, setEventName] = useState("");
  const [free, setFree] = useState(false);
  const [draftDate, setDraftDate] = useState("2026-10-05");
  const [draftStart, setDraftStart] = useState("13:00");
  const [draftEnd, setDraftEnd] = useState("15:00");
  const [draftRoom, setDraftRoom] = useState("Bill Gates Room");
  const [createdSchedules, setCreatedSchedules] = useState([
    { date: "2026-10-05", start: "13:00", end: "15:00", room: "Bill Gates Room" },
  ]);
  const [scheduleError, setScheduleError] = useState("");
  const placeholder: Record<EventType, string> = {
    Workshop: "Workshop Name: Date or Session",
    Trial: "Trial Date — Trial Session/Time",
    Bootcamp: "Bootcamp Name & Material: Session or Class Name",
    PTM: "PTM Date — Teacher/Moderator Name",
    "Internal Meeting": "Internal Meeting Name — Meeting Date",
  };
  const price = internal ? "—" : free ? "Free" : eventType === "Bootcamp" ? "IDR 1,500,000" : eventType === "Trial" ? "IDR 150,000" : "IDR 350,000";
  function addSchedule() {
    if (!draftDate || !draftStart || !draftEnd || !draftRoom || draftEnd <= draftStart) return setScheduleError("Enter a valid date and time range.");
    if (single && createdSchedules.length >= 1) return setScheduleError(`${eventType} supports one schedule only.`);
    if (createdSchedules.some((schedule) => schedule.date === draftDate && schedule.start === draftStart && schedule.end === draftEnd && schedule.room === draftRoom)) return setScheduleError("This schedule already exists.");
    setCreatedSchedules((current) => [...current, { date: draftDate, start: draftStart, end: draftEnd, room: draftRoom }]);
    setScheduleError("");
  }
  function saveEvent() {
    if (!eventName.trim() || createdSchedules.length === 0) return;
    const scheduleLabel = createdSchedules.length === 1
      ? `${createdSchedules[0].date}, ${createdSchedules[0].start}`
      : `${createdSchedules.length} schedules`;
    onSave(
      [eventName.trim(), eventType, scheduleLabel, "0", price, "Active"],
      createdSchedules.map((schedule) => ({
        date: displayDate(schedule.date),
        isoDate: schedule.date,
        startTime: schedule.start,
        endTime: schedule.end,
        teacher: "Nimas Sekararum Kinanthi",
        room: schedule.room,
        locked: false,
        attendanceStarted: false,
      })),
    );
  }
  return (
    <>
      <PageHeader title="Create Event" subtitle="Complete the form below to create an event." back={onBack} actions={<><button className="btn outline" onClick={onBack}>Discard</button><button className="btn primary" disabled={!eventName.trim() || createdSchedules.length === 0} onClick={saveEvent}><Check size={16} /> Save Event</button></>} />
      <div className="create-grid">
        <div>
          <section className="card form-card">
            <div className="card-head"><h2><BookOpen size={18} /> Basic Information</h2></div>
            <label>Branch Availability<select><option>HQ Training</option></select></label>
            <label>Event Type<select value={eventType} onChange={(e) => {
              const nextType = e.target.value as EventType;
              setEventType(nextType);
              if (nextType === "Trial" || nextType === "PTM") setCreatedSchedules((current) => current.slice(0, 1));
              if (nextType === "Internal Meeting") setFree(true);
            }}><option>Workshop</option><option>Trial</option><option>Bootcamp</option><option value="PTM">Parent Teacher Meeting (PTM)</option><option>Internal Meeting</option></select></label>
            <label>Event Name<input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder={placeholder[eventType]} /></label>
            <div className="form-two"><label>Book<select><option>{internal ? "Internal Meeting Agenda" : eventType === "Trial" ? "All Courses — Trial" : eventType === "PTM" ? "Mentoring Handbook" : `${eventType} Learning Book`}</option></select></label><label>Language Book<select><option>{eventType === "PTM" || internal ? "Indonesian" : "English"}</option></select></label></div>
            {!internal ? (
              <>
                <button type="button" className="toggle-row toggle-button" onClick={() => setFree((value) => !value)}><div><b>Free Event</b></div><Toggle on={free} /></button>
                <div className="form-two"><label>Currency<select disabled={free}><option>Indonesia (IDR)</option></select></label><label>Base Price<input value={free ? "0" : eventType === "Bootcamp" ? "1,500,000" : eventType === "Trial" ? "150,000" : "350,000"} readOnly /></label></div>
              </>
            ) : (
              <div className="notice neutral"><LockKeyhole size={17} /><span><b>Student Ordering — Not Available</b><small>Internal Meeting cannot be ordered by students.</small></span></div>
            )}
          </section>
          <section className="card form-card schedule-create">
            <div className="card-head"><h2><CalendarDays size={18} /> Schedule</h2><small>{single ? `${eventType} supports one schedule only.` : `${eventType} supports multiple schedules.`}</small></div>
            <div className="notice blue"><AlertCircle size={17} /> Please select each day to set schedule, using Asia/Jakarta timezone.</div>
            {(!single || createdSchedules.length === 0) && <div className="schedule-fields"><input type="date" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} /><input type="time" value={draftStart} onChange={(e) => setDraftStart(e.target.value)} /><input type="time" value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)} /><select value={draftRoom} onChange={(e) => setDraftRoom(e.target.value)}><option>Bill Gates Room</option><option>Steve Jobs Room</option><option>Jeff Bezos Room</option></select><button className="btn primary" disabled={draftEnd <= draftStart} onClick={addSchedule}><Plus size={15} /> Add</button></div>}
            {scheduleError && <div className="notice warning">{scheduleError}</div>}
            {single && createdSchedules.length > 0 && <p className="muted">{eventType} allows one schedule. Remove the existing schedule to add a different one.</p>}
            <h3>Added Schedule{single ? "" : "s"}</h3>
            <table><thead><tr><th>Date</th><th>Time</th><th>Room</th><th>Action</th></tr></thead><tbody>
              {createdSchedules.map((schedule, index) => <tr key={`${schedule.date}-${schedule.start}-${index}`}><td>{schedule.date}</td><td>{schedule.start}–{schedule.end}</td><td>{schedule.room}</td><td><button className="icon-btn danger-icon" onClick={() => setCreatedSchedules((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button></td></tr>)}
            </tbody></table>
          </section>
        </div>
        <section className="card settings-card"><div className="card-head"><h2><Settings size={18} /> Settings</h2></div><div className="toggle-row"><b>Active</b><Toggle on /></div>{internal && <div className="detail-row"><span>Student Ordering</span><span className="badge neutral">Disabled</span></div>}</section>
      </div>
    </>
  );
}

function AttendancePage({ onBack }: { onBack: () => void }) {
  const students = [
    ["Axel Mikhail Ahmad", "Not Marked", "—", "Not Available", "—"],
    ["Bella Natasha Putri", "Present", "No", "View Journal", "—"],
    ["Kevin Pratama", "Absent", "—", "Not Available", "Sick"],
    ["Siti Rahmawati", "Not Marked", "—", "Not Available", "—"],
  ];
  return (
    <>
      <PageHeader title="Attendance Detail" subtitle="Digital Literacy Workshop · 28 Sep 2026" back={onBack} actions={<span className="badge warning">Ongoing</span>} />
      <section className="card compact-info"><div><small>Date</small><b>28 Sep 2026</b></div><div><small>Time</small><b>13:00–15:00</b></div><div><small>Room</small><b>Bill Gates Room</b></div><div><small>Main Teacher</small><b>Nimas Sekararum Kinanthi</b></div></section>
      <div className="summary-grid three">
        <Summary title="Room Name" value="Bill Gates Room" icon={<BookOpen size={18} />} />
        <Summary title="Total Student" value="24" icon={<UsersRound size={18} />} />
        <Summary title="Total Teacher" value="1" icon={<UserRound size={18} />} />
      </div>
      <section className="card small-table"><div className="card-head"><h2>Teacher List <span className="mini-count">1 Teacher</span></h2><button className="btn outline"><Plus size={15} /> Add Teacher</button></div>
        <table><thead><tr><th>Teacher Name</th><th>Role</th><th>Attendance Status</th><th>Action</th></tr></thead><tbody><tr><td><b>Nimas Sekararum Kinanthi</b><small>TCR-20251102-007</small></td><td>Main Teacher</td><td><span className="badge success">Present</span></td><td><MoreHorizontal size={17} /></td></tr></tbody></table>
      </section>
      <section className="card"><div className="card-head"><h2>Student List <span className="mini-count">24 Students</span></h2><div className="head-actions"><div className="search"><Search size={15} /><input placeholder="Search Student" /></div><select><option>All Presence</option></select><button className="btn outline"><Plus size={15} /> Add Student</button></div></div>
        <table><thead><tr><th>Student Name</th><th>Session</th><th>Presence</th><th>Late</th><th>Meeting Journal</th><th>Note</th><th>Action</th></tr></thead><tbody>
          {students.map((s, i) => <tr key={s[0]}><td><b>{s[0]}</b><small>STD-20260818-408{i}</small></td><td>Session 2</td><td><span className={`badge ${s[1] === "Present" ? "success" : s[1] === "Absent" ? "danger" : "neutral"}`}>{s[1]}</span></td><td>{s[2]}</td><td className={s[3] === "View Journal" ? "green-link" : "muted"}>{s[3]}</td><td>{s[4]}</td><td><MoreHorizontal size={17} /></td></tr>)}
        </tbody></table><TableFooter total="1–4 of 24" />
      </section>
    </>
  );
}

function RescheduleModal({
  step,
  setStep,
  schedule,
  onConfirm,
}: {
  step: 0 | 1 | 2 | 3;
  setStep: (s: 0 | 1 | 2 | 3) => void;
  schedule: EventSchedule | null;
  onConfirm: (schedule: EventSchedule) => void;
}) {
  const [newDate, setNewDate] = useState(schedule?.isoDate ?? "2026-10-05");
  const [newStart, setNewStart] = useState(schedule?.startTime ?? "13:00");
  const [newEnd, setNewEnd] = useState(schedule?.endTime ?? "15:00");
  const [newRoom, setNewRoom] = useState(schedule?.room ?? "Bill Gates Room");
  const [newTeacher, setNewTeacher] = useState(schedule?.teacher ?? "Nimas Sekararum Kinanthi");
  const [reason, setReason] = useState("");
  if (step === 0) return null;
  if (!schedule) return null;
  const unchanged = newDate === schedule.isoDate && newStart === schedule.startTime && newEnd === schedule.endTime && newRoom === schedule.room && newTeacher === schedule.teacher;
  const invalidSchedule = !newDate || !newStart || !newEnd || newEnd <= newStart || !reason.trim() || unchanged;
  if (step === 3) {
    return <Modal onClose={() => setStep(0)}><div className="success-view"><div className="success-icon"><Check /></div><h2>Event successfully rescheduled</h2><p>24 participants will follow the new schedule.</p><button className="btn primary" onClick={() => setStep(0)}>Back to Schedule</button></div></Modal>;
  }
  return (
    <Modal onClose={() => setStep(0)}>
      <div className="modal-head"><div><h2>{step === 1 ? "Reschedule Event" : "Review Reschedule"}</h2><p>Digital Literacy Workshop · {schedule.date}</p></div><button className="icon-btn" onClick={() => setStep(0)}><X /></button></div>
      <Stepper current={step} labels={["New Schedule", "Review"]} />
      {step === 1 ? (
        <>
          <div className="notice success"><Clock3 size={17} /> Reschedule is allowed until 2 hours before the schedule starts, while attendance is empty.</div>
          <div className="read-card"><small>Current Schedule</small><div className="compact-info"><div><b>{schedule.date}</b></div><div>{schedule.startTime}–{schedule.endTime}</div><div>{schedule.room}</div><div>{schedule.teacher}</div></div></div>
          <div className="form-two"><label>New Date<input type="date" min="2026-10-01" value={newDate} onChange={(e) => setNewDate(e.target.value)} /></label><label>Room<select value={newRoom} onChange={(e) => setNewRoom(e.target.value)}><option>Bill Gates Room</option><option>Steve Jobs Room</option><option>Jeff Bezos Room</option></select></label></div>
          <div className="form-two"><label>Start Time<input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} /></label><label>End Time<input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} /></label></div>
          <label>Main Teacher<select value={newTeacher} onChange={(e) => setNewTeacher(e.target.value)}><option>Nimas Sekararum Kinanthi</option><option>Budi Wicaksono</option></select></label>
          <label>Reason for Reschedule<textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Tutor unavailable" /></label>
          {newEnd <= newStart && <div className="notice warning">End time must be later than start time.</div>}
          {unchanged && reason.trim() && <div className="notice warning">Change at least one schedule field before continuing.</div>}
          <div className="modal-foot"><button className="btn outline" onClick={() => setStep(0)}>Cancel</button><button className="btn primary" disabled={invalidSchedule} onClick={() => setStep(2)}>Continue</button></div>
        </>
      ) : (
        <>
          <div className="compare"><div><small>Current Schedule</small><h3>{schedule.date}</h3><p>{schedule.startTime}–{schedule.endTime}<br />{schedule.room}</p></div><ArrowRight /><div className="new"><small>New Schedule</small><h3>{displayDate(newDate)}</h3><p>{newStart}–{newEnd}<br />{newRoom}</p></div></div>
          <div className="notice success"><Check size={17} /><span>24 participants will follow the new schedule.<br />Existing orders and payments will not change.</span></div>
          <label className="check-row"><input type="checkbox" defaultChecked /> Notify parents, students, and teacher.</label>
          <div className="modal-foot"><button className="btn outline" onClick={() => setStep(1)}>Back</button><button className="btn primary" onClick={() => {
            onConfirm({
              ...schedule,
              date: displayDate(newDate),
              isoDate: newDate,
              startTime: newStart,
              endTime: newEnd,
              room: newRoom,
              teacher: newTeacher,
              locked: false,
              attendanceStarted: false,
            });
            setStep(3);
          }}>Confirm Reschedule</button></div>
        </>
      )}
    </Modal>
  );
}

function TransferFlow({
  step, setStep, priceCase, setPriceCase, destination, reviewed, setReviewed, onTransferred,
}: {
  step: TransferStep;
  setStep: (s: TransferStep) => void;
  priceCase: PriceCase;
  setPriceCase: (p: PriceCase) => void;
  destination: (typeof destinationEvents)[number];
  reviewed: boolean;
  setReviewed: (v: boolean) => void;
  onTransferred: () => void;
}) {
  const delta = destination.price - 350000;
  if (step === 4) {
    return <div className="flow-overlay"><div className="flow-page"><button className="flow-close" onClick={() => setStep(0)}><X /></button><SuccessTransfer destination={destination} delta={delta} onClose={() => setStep(0)} /></div></div>;
  }
  return (
    <div className="flow-overlay">
      <div className="flow-page">
        <button className="flow-close" onClick={() => setStep(0)}><X /></button>
        <PageHeader title="Move Participant" subtitle={step === 1 ? "Select a destination event for Axel Mikhail Ahmad." : step === 2 ? "Review the price adjustment for the selected destination event." : "Review the participant transfer before confirming."} />
        <Stepper current={step} labels={["Select Event", "Price Adjustment", "Review"]} />
        <section className="card compact-info participant-strip"><div><small>Student</small><b>Axel Mikhail Ahmad</b><span>STD-20260818-4080</span></div><div><small>Current Event</small><b>Digital Literacy Workshop</b></div><div><small>Current Schedule</small><b>28 Sep 2026, 13:00–15:00</b></div><div><small>Amount Paid</small><b>IDR 350,000</b></div></section>
        {step === 1 && (
          <section className="card">
            <div className="card-head"><div><h2>Choose Destination Event</h2><p>Only eligible events with available quota are displayed.</p></div></div>
            <div className="filters compact"><div className="search"><Search size={15} /><input defaultValue="Digital" /></div><select><option>Workshop</option></select><input type="month" defaultValue="2026-10" /></div>
            <table><thead><tr><th>Select</th><th>Event</th><th>Date & Time</th><th>Available Quota</th><th>Price</th></tr></thead><tbody>
              {destinationEvents.map((e) => <tr key={e.id} className={priceCase === e.id ? "selected-row" : ""} onClick={() => setPriceCase(e.id)}><td><input type="radio" checked={priceCase === e.id} readOnly /></td><td><b>{e.name}</b><small>{e.room}</small></td><td>{e.date}<small>{e.time}</small></td><td>{e.quota}</td><td>{money(e.price)}</td></tr>)}
            </tbody></table>
            <div className="modal-foot"><span className="muted">1 event selected</span><div><button className="btn outline" onClick={() => setStep(0)}>Cancel</button><button className="btn primary" onClick={() => setStep(2)}>Continue <ArrowRight size={15} /></button></div></div>
          </section>
        )}
        {step === 2 && <PriceAdjustment destination={destination} delta={delta} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <TransferReview destination={destination} delta={delta} reviewed={reviewed} setReviewed={setReviewed} onBack={() => setStep(2)} onConfirm={() => { onTransferred(); setStep(4); }} />}
      </div>
    </div>
  );
}

function PriceAdjustment({ destination, delta, onBack, onNext }: { destination: (typeof destinationEvents)[number]; delta: number; onBack: () => void; onNext: () => void }) {
  return (
    <>
      <section className="card selected-destination"><div className="card-head"><h2>Selected Destination Event</h2><button className="text-action" onClick={onBack}>Change Event</button></div><div className="compact-info"><div><small>Event</small><b>{destination.name}</b></div><div><small>Schedule</small><b>{destination.date}, {destination.time}</b></div><div><small>Available Quota</small><b>{destination.quota}</b></div><div><small>Event Price</small><b>{money(destination.price)}</b></div></div></section>
      <section className="card">
        <div className="card-head"><h2>Price Adjustment</h2></div>
        <div className="price-lines"><div><span>Amount Already Paid</span><b>IDR 350,000</b></div><div><span>Destination Event Price</span><b>{money(destination.price)}</b></div><div className={delta > 0 ? "attention" : "positive"}><b>{delta > 0 ? "Additional Payment" : delta < 0 ? "Balance Credit" : "Price Difference"}</b><b>{money(Math.abs(delta))}</b></div></div>
        <div className={`notice ${delta > 0 ? "warning" : "success"}`}>{delta > 0 ? `An additional invoice of ${money(delta)} is required.` : delta < 0 ? `${money(-delta)} will be added to the customer balance.` : "No additional payment is required."}</div>
        {delta !== 0 && <div className="option-row"><input type="radio" checked readOnly /><div><b>{delta > 0 ? "Create additional invoice" : "Convert difference to customer balance"}</b><small>{delta > 0 ? "Only the price difference will be invoiced." : "The balance can be used for a future order."}</small></div><b>{money(Math.abs(delta))}</b></div>}
        <h3>Transfer Details</h3>
        <label>Reason for Transfer<select><option>Schedule conflict</option></select></label>
        <label>Internal Note<textarea placeholder="Add a note for internal reference." /></label>
        <div className="modal-foot"><button className="btn outline" onClick={onBack}>Back</button><button className="btn primary" onClick={onNext}>Continue to Review <ArrowRight size={15} /></button></div>
      </section>
    </>
  );
}

function TransferReview({ destination, delta, reviewed, setReviewed, onBack, onConfirm }: { destination: (typeof destinationEvents)[number]; delta: number; reviewed: boolean; setReviewed: (v: boolean) => void; onBack: () => void; onConfirm: () => void }) {
  return (
    <section className="card review-card">
      <div className="card-head"><h2>Transfer Review</h2><small>Step 3 of 3 · Final Confirmation</small></div>
      <div className="review-columns">
        <div><h4>Schedule Transfer</h4><div className="compare compact"><div><small>From</small><b>Digital Literacy Workshop</b><p>28 Sep 2026<br />13:00–15:00<br />Bill Gates Room</p></div><ArrowRight /><div className="new"><small>To</small><b>{destination.name}</b><p>{destination.date}<br />{destination.time}<br />{destination.room}</p></div></div></div>
        <div className="payment-review"><h4>Payment Summary</h4><div className="price-lines"><div><span>Amount Already Paid</span><b>IDR 350,000</b></div><div><span>Destination Price</span><b>{money(destination.price)}</b></div><div className="positive"><b>{delta > 0 ? "Additional Payment" : delta < 0 ? "Balance Credit" : "Price Difference"}</b><b>{money(Math.abs(delta))}</b></div></div><div className={`notice ${delta > 0 ? "warning" : "success"}`}>{delta > 0 ? `An additional invoice of ${money(delta)} will be created.` : delta < 0 ? `${money(-delta)} will be added to customer balance.` : "No additional payment is required."}</div><h4>Transfer Details</h4><div className="detail-row"><span>Reason</span><b>Schedule conflict</b></div></div>
      </div>
      <div className="notice neutral">Axel will be moved to the destination event. The original enrollment, order, and payment history will be preserved.</div>
      <label className="check-row"><input type="checkbox" defaultChecked /> Notify parent and student about the new schedule.</label>
      <label className="check-row"><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} /> I have reviewed the transfer and payment details.</label>
      <div className="modal-foot"><button className="btn outline" onClick={onBack}>Back</button><button className="btn primary" disabled={!reviewed} onClick={onConfirm}>{delta > 0 ? "Confirm Transfer & Create Invoice" : delta < 0 ? "Confirm Transfer & Add Balance" : "Confirm Transfer"}</button></div>
    </section>
  );
}

function SuccessTransfer({ destination, delta, onClose }: { destination: (typeof destinationEvents)[number]; delta: number; onClose: () => void }) {
  return (
    <>
      <PageHeader title="Move Participant" subtitle="The participant transfer has been completed." />
      <section className="card success-card">
        <div className="success-icon"><Check /></div><h2>Participant successfully moved</h2><p>Axel Mikhail Ahmad has been moved to {destination.name}.</p>
        <h3>Transfer Summary</h3>
        <div className="result-grid">
          <div><small>Student</small><b>Axel Mikhail Ahmad</b><small>Destination Event</small><b>{destination.name}</b><small>New Schedule</small><b>{destination.date}, {destination.time}</b><small>Room</small><b>{destination.room}</b></div>
          <div><small>Enrollment Status</small><span className="badge success">Transferred</span><small>Original Payment</small><b>IDR 350,000 preserved</b><small>{delta > 0 ? "Additional Invoice" : delta < 0 ? "Balance Credit" : "Price Adjustment"}</small><b>{money(Math.abs(delta))}</b><small>Status</small><span className={`badge ${delta > 0 ? "warning" : "success"}`}>{delta > 0 ? "Pending Payment" : delta < 0 ? "Balance Added" : "Completed"}</span></div>
        </div>
        <div className="notice success">{delta > 0 ? `The transfer was successful and an additional invoice of ${money(delta)} was created.` : delta < 0 ? `The transfer was successful and ${money(-delta)} was added to customer balance.` : "The original enrollment, order, and payment history remain available."}</div>
        <div className="modal-foot"><button className="btn outline" onClick={onClose}>Back to Participants</button><button className="btn primary">{delta > 0 ? "View Additional Invoice" : delta < 0 ? "View Customer Balance" : "View Destination Event"}</button></div>
      </section>
    </>
  );
}

function ImportModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-head"><div><h2>Import Participants</h2><p>Upload a spreadsheet to add multiple participants to this event.</p></div><button className="icon-btn" onClick={onClose}><X /></button></div>
      <div className="compact-info import-context"><div><small>Event</small><b>Digital Literacy Workshop</b></div><div><small>Schedule</small><b>5 Oct 2026, 13:00–15:00</b></div><div><small>Current Participants</small><b>22 students</b></div></div>
      <div className="notice warning"><AlertCircle size={17} /> The spreadsheet format and required columns are still being finalized.</div>
      <div className="upload-box"><FileSpreadsheet size={30} /><h3>Upload participant spreadsheet</h3><p>XLSX or CSV, maximum 10 MB</p><button className="btn outline"><Upload size={15} /> Choose File</button><small>or drag and drop a file here</small></div>
      <div className="modal-foot"><button className="btn outline" onClick={onClose}>Cancel</button><button className="btn primary" disabled>Continue</button></div>
    </Modal>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal">{children}</div></div>;
}

function Stepper({ current, labels }: { current: number; labels: string[] }) {
  return <div className="stepper">{labels.map((l, i) => { const n = i + 1; const done = n < current; const active = n === current; return <div className={`step ${done ? "done" : active ? "active" : ""}`} key={l}><span>{done ? <Check size={12} /> : n}</span><b>{n}. {l}</b></div>; })}</div>;
}

function Summary({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <section className="card summary"><div><small>{title}</small><b>{value}</b></div><span>{icon}</span></section>;
}

function TableFooter({ total }: { total: string }) {
  return <div className="table-footer"><span>Items per page: <b>10</b></span><span>{total}</span><button>‹</button><button>›</button></div>;
}

function Toggle({ on }: { on: boolean }) {
  return <span className={`toggle ${on ? "on" : ""}`}><i /></span>;
}