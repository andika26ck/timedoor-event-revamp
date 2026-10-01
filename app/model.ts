export type EventType = "Workshop" | "Trial" | "Bootcamp" | "PTM" | "Internal Meeting";
export type Presence = "Not Marked" | "Present" | "Absent";

export type AttendanceRecord = {
  presence: Presence;
  lateMinutes: number;
  journal: string;
  note: string;
};

export type Participant = {
  id: string;
  name: string;
  parent: string;
  amountPaid: number;
  paymentStatus: "Paid" | "Pending" | "Free";
  attendance: Record<string, AttendanceRecord>;
};

export type EventSchedule = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  teacher: string;
  room: string;
};

export type FinanceEntry = {
  id: string;
  participantName: string;
  kind: "Additional Invoice" | "Balance Credit";
  amount: number;
  status: "Pending Payment" | "Completed";
  createdAt: string;
};

export type EventRecord = {
  id: string;
  name: string;
  type: EventType;
  branch: string;
  book: string;
  language: string;
  price: number;
  free: boolean;
  studentOrderable: boolean;
  quota: number;
  active: boolean;
  schedules: EventSchedule[];
  participants: Participant[];
  finance: FinanceEntry[];
  createdAt: string;
};

export const eventTypeRules: Record<EventType, {
  singleSchedule: boolean;
  placeholder: string;
  studentOrderable: boolean;
}> = {
  Workshop: {
    singleSchedule: false,
    placeholder: "Workshop Name: Date or Session",
    studentOrderable: true,
  },
  Trial: {
    singleSchedule: true,
    placeholder: "Trial Date — Trial Session/Time",
    studentOrderable: true,
  },
  Bootcamp: {
    singleSchedule: false,
    placeholder: "Bootcamp Name & Material: Session or Class Name",
    studentOrderable: true,
  },
  PTM: {
    singleSchedule: true,
    placeholder: "PTM Date — Teacher/Moderator Name",
    studentOrderable: true,
  },
  "Internal Meeting": {
    singleSchedule: false,
    placeholder: "Internal Meeting Name — Meeting Date",
    studentOrderable: false,
  },
};

const attendance = (): AttendanceRecord => ({
  presence: "Not Marked",
  lateMinutes: 0,
  journal: "",
  note: "",
});

const participant = (
  id: string,
  name: string,
  parent: string,
  amountPaid: number,
  status: Participant["paymentStatus"],
  scheduleIds: string[],
): Participant => ({
  id,
  name,
  parent,
  amountPaid,
  paymentStatus: status,
  attendance: Object.fromEntries(scheduleIds.map((id) => [id, attendance()])),
});

const schedule = (
  id: string,
  date: string,
  startTime: string,
  endTime: string,
  teacher: string,
  room: string,
): EventSchedule => ({ id, date, startTime, endTime, teacher, room });

export const initialEvents: EventRecord[] = [
  {
    id: "event-workshop-digital",
    name: "Digital Literacy Workshop",
    type: "Workshop",
    branch: "HQ Training",
    book: "Digital Literacy Workshop",
    language: "English",
    price: 350000,
    free: false,
    studentOrderable: true,
    quota: 30,
    active: true,
    schedules: [
      schedule("sch-digital-1", "2026-09-28", "13:00", "15:00", "Nimas Sekararum Kinanthi", "Bill Gates Room"),
      schedule("sch-digital-2", "2026-10-05", "13:00", "15:00", "Nimas Sekararum Kinanthi", "Bill Gates Room"),
      schedule("sch-digital-3", "2026-10-12", "13:00", "15:00", "Budi Wicaksono", "Steve Jobs Room"),
    ],
    participants: [
      participant("STD-20260818-4080", "Axel Mikhail Ahmad", "Axel Mikhail", 350000, "Paid", ["sch-digital-1", "sch-digital-2", "sch-digital-3"]),
      participant("STD-20260818-4081", "Bella Natasha Putri", "Sari Indah", 350000, "Paid", ["sch-digital-1", "sch-digital-2", "sch-digital-3"]),
      participant("STD-20260818-4082", "Kevin Pratama", "Rina Pratama", 350000, "Pending", ["sch-digital-1", "sch-digital-2", "sch-digital-3"]),
    ],
    finance: [],
    createdAt: "2026-09-24T10:00:00Z",
  },
  {
    id: "event-workshop-advanced",
    name: "Advanced Digital Workshop",
    type: "Workshop",
    branch: "HQ Training",
    book: "Advanced Digital",
    language: "English",
    price: 500000,
    free: false,
    studentOrderable: true,
    quota: 10,
    active: true,
    schedules: [schedule("sch-advanced-1", "2026-10-12", "16:00", "18:00", "Budi Wicaksono", "Steve Jobs Room")],
    participants: [],
    finance: [],
    createdAt: "2026-09-25T10:00:00Z",
  },
  {
    id: "event-workshop-intro",
    name: "Intro to Digital Art",
    type: "Workshop",
    branch: "HQ Training",
    book: "Digital Art",
    language: "English",
    price: 250000,
    free: false,
    studentOrderable: true,
    quota: 10,
    active: true,
    schedules: [schedule("sch-intro-1", "2026-10-19", "10:00", "12:00", "Nimas Sekararum Kinanthi", "Jeff Bezos Room")],
    participants: [],
    finance: [],
    createdAt: "2026-09-26T10:00:00Z",
  },
  {
    id: "event-trial-robotics",
    name: "Trial Robotics",
    type: "Trial",
    branch: "HQ Training",
    book: "All Courses — Trial",
    language: "English",
    price: 150000,
    free: false,
    studentOrderable: true,
    quota: 8,
    active: true,
    schedules: [schedule("sch-trial-1", "2026-10-08", "13:00", "14:30", "Budi Wicaksono", "Bill Gates Room")],
    participants: [],
    finance: [],
    createdAt: "2026-09-20T10:00:00Z",
  },
  {
    id: "event-bootcamp-holiday",
    name: "Holiday Coding Bootcamp",
    type: "Bootcamp",
    branch: "HQ Training",
    book: "Roblox Developer",
    language: "English",
    price: 1500000,
    free: false,
    studentOrderable: true,
    quota: 20,
    active: true,
    schedules: [
      schedule("sch-bootcamp-1", "2026-10-10", "09:00", "11:00", "Nimas Sekararum Kinanthi", "Bill Gates Room"),
      schedule("sch-bootcamp-2", "2026-10-11", "09:00", "11:00", "Nimas Sekararum Kinanthi", "Bill Gates Room"),
    ],
    participants: [],
    finance: [],
    createdAt: "2026-09-18T10:00:00Z",
  },
  {
    id: "event-ptm-grade-5",
    name: "PTM Grade 5",
    type: "PTM",
    branch: "HQ Training",
    book: "Mentoring Handbook",
    language: "Indonesian",
    price: 0,
    free: true,
    studentOrderable: true,
    quota: 12,
    active: true,
    schedules: [schedule("sch-ptm-1", "2026-10-15", "10:00", "12:00", "Nimas Sekararum Kinanthi", "Jeff Bezos Room")],
    participants: [],
    finance: [],
    createdAt: "2026-09-17T10:00:00Z",
  },
  {
    id: "event-internal-monthly",
    name: "Monthly Teacher Meeting",
    type: "Internal Meeting",
    branch: "HQ Training",
    book: "Internal Meeting Agenda",
    language: "Indonesian",
    price: 0,
    free: true,
    studentOrderable: false,
    quota: 30,
    active: true,
    schedules: [
      schedule("sch-meeting-1", "2026-10-06", "09:00", "10:00", "Nimas Sekararum Kinanthi", "Bill Gates Room"),
      schedule("sch-meeting-2", "2026-11-06", "09:00", "10:00", "Nimas Sekararum Kinanthi", "Bill Gates Room"),
    ],
    participants: [],
    finance: [],
    createdAt: "2026-09-16T10:00:00Z",
  },
];

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function scheduleStart(value: EventSchedule) {
  return new Date(`${value.date}T${value.startTime}:00+07:00`);
}

export function attendanceStarted(event: EventRecord, scheduleId: string) {
  return event.participants.some((item) => item.attendance[scheduleId]?.presence !== "Not Marked");
}

export function canReschedule(event: EventRecord, item: EventSchedule, now = new Date()) {
  return scheduleStart(item).getTime() - now.getTime() >= 2 * 60 * 60 * 1000 &&
    !attendanceStarted(event, item.id);
}

export function ensureAttendance(participantValue: Participant, scheduleId: string) {
  return participantValue.attendance[scheduleId] ?? attendance();
}