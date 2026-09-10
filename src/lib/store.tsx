import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Role = "patient" | "doctor" | "responder" | "judge";

export type Vital = {
  date: string;
  systolic: number;
  diastolic: number;
  glucose: number;
  pulse: number;
  weight: number;
  spo2: number;
};

export type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  kind: "diagnosis" | "visit" | "surgery" | "immunization" | "lab";
  facility: string;
  detail: string;
};

export type DocumentRecord = {
  id: string;
  name: string;
  type: "Lab Report" | "Prescription" | "Radiology" | "Discharge Summary";
  date: string;
  facility: string;
  size: string;
  summary: string;
};

export type Prescription = {
  id: string;
  date: string;
  doctor: string;
  diagnosis: string;
  medicines: { name: string; dose: string; frequency: string; duration: string }[];
  labOrders: string[];
  notes: string;
};

export type ConsentRequest = {
  id: string;
  requester: string;
  purpose: string;
  scopes: string[];
  requestedOn: string;
  expiry: string;
  status: "pending" | "active" | "revoked" | "denied";
};

export type AuditEntry = {
  id: string;
  time: string;
  actor: string;
  action: string;
  scope: string;
  location: string;
  hash: string;
  prevHash: string;
  override: boolean;
};

export type QueueItem = {
  id: string;
  label: string;
  kind: string;
  createdAt: string;
  status: "queued" | "synced";
};

export type QueuePatient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  abha: string;
  reason: string;
  token: number;
  status: "waiting" | "in-consult" | "done";
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export type Patient = {
  id: string;
  abha: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  language: string;
  phone: string;
  address: string;
  conditions: string[];
  allergies: string[];
  medications: { name: string; dose: string; frequency: string }[];
  surgeries: { name: string; year: string }[];
  emergencyContact: { name: string; relation: string; phone: string };
  insurance: string;
};

export type AppState = {
  role: Role;
  patient: Patient;
  vitals: Vital[];
  timeline: TimelineEvent[];
  documents: DocumentRecord[];
  prescriptions: Prescription[];
  consents: ConsentRequest[];
  audit: AuditEntry[];
  queue: QueuePatient[];
  syncQueue: QueueItem[];
  online: boolean;
  notifications: Notification[];
  clinicalNotes: { id: string; date: string; author: string; text: string }[];
  appointments: { id: string; date: string; time: string; doctor: string; dept: string; mode: string }[];
  demoStep: number;
  demoScenario: string;
};

const today = new Date();
const dayOffset = (d: number) => {
  const x = new Date(today);
  x.setDate(x.getDate() - d);
  return x.toISOString().slice(0, 10);
};

export function nowStamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export function shortHash(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0") + (input.length * 2654435761 % 0xffffff).toString(16);
}

const initialAuditSeed: AuditEntry[] = [];
{
  let prev = "0000000000000";
  const seeds = [
    {
      actor: "Dr. Meera Iyer · AIIMS Trauma Bay",
      action: "Emergency profile accessed",
      scope: "Allergies, Blood Group, Conditions",
      location: "New Delhi, IN",
      override: false,
    },
    {
      actor: "Paramedic Unit 108-DL42",
      action: "Break-glass override",
      scope: "Full emergency card",
      location: "Gurugram, HR",
      override: true,
    },
    {
      actor: "Apollo Diagnostics",
      action: "Lab report uploaded to locker",
      scope: "Documents",
      location: "Bengaluru, KA",
      override: false,
    },
  ];
  seeds.forEach((s, i) => {
    const time = nowStamp();
    const hash = shortHash(prev + s.actor + s.action + i);
    initialAuditSeed.push({ id: `AUD-${1000 + i}`, time, hash, prevHash: prev, ...s });
    prev = hash;
  });
}

export const initialState: AppState = {
  role: "patient",
  patient: {
    id: "SS-10024",
    abha: "12-3456-7890-1024",
    name: "Rahul Sharma",
    age: 42,
    gender: "Male",
    bloodGroup: "O+",
    language: "Kannada",
    phone: "+91 98450 21024",
    address: "No. 42, 5th Cross, Indiranagar, Bengaluru 560038",
    conditions: ["Type 2 Diabetes", "Hypertension"],
    allergies: ["Penicillin"],
    medications: [
      { name: "Metformin", dose: "500 mg", frequency: "Twice daily after meals" },
      { name: "Amlodipine", dose: "5 mg", frequency: "Once daily, morning" },
    ],
    surgeries: [{ name: "Appendectomy", year: "2023" }],
    emergencyContact: { name: "Priya Sharma", relation: "Spouse", phone: "+91 98450 77310" },
    insurance: "Ayushman Bharat PM-JAY · Active",
  },
  vitals: [
    { date: dayOffset(150), systolic: 148, diastolic: 96, glucose: 186, pulse: 88, weight: 84, spo2: 96 },
    { date: dayOffset(120), systolic: 144, diastolic: 92, glucose: 172, pulse: 86, weight: 83, spo2: 97 },
    { date: dayOffset(90), systolic: 138, diastolic: 90, glucose: 158, pulse: 82, weight: 82, spo2: 97 },
    { date: dayOffset(60), systolic: 136, diastolic: 88, glucose: 149, pulse: 80, weight: 81, spo2: 98 },
    { date: dayOffset(30), systolic: 132, diastolic: 86, glucose: 141, pulse: 78, weight: 80, spo2: 98 },
    { date: dayOffset(7), systolic: 128, diastolic: 84, glucose: 132, pulse: 76, weight: 79, spo2: 98 },
  ],
  timeline: [
    {
      id: "TL-1",
      date: dayOffset(7),
      title: "Endocrinology follow-up",
      kind: "visit",
      facility: "Manipal Hospital, Bengaluru",
      detail: "HbA1c improving. Continue Metformin 500mg BD. Review in 3 months.",
    },
    {
      id: "TL-2",
      date: dayOffset(30),
      title: "HbA1c 7.4%",
      kind: "lab",
      facility: "Apollo Diagnostics",
      detail: "Down from 8.6% six months ago. Fasting glucose 132 mg/dL.",
    },
    {
      id: "TL-3",
      date: dayOffset(210),
      title: "Hypertension diagnosed (Stage 1)",
      kind: "diagnosis",
      facility: "PHC Indiranagar",
      detail: "Started on Amlodipine 5mg OD. Salt restriction advised.",
    },
    {
      id: "TL-4",
      date: "2023-06-18",
      title: "Laparoscopic Appendectomy",
      kind: "surgery",
      facility: "Manipal Hospital, Bengaluru",
      detail: "Uneventful recovery. Discharged after 48 hours. No complications.",
    },
    {
      id: "TL-5",
      date: "2021-08-02",
      title: "COVID-19 Vaccination · Dose 2 (Covishield)",
      kind: "immunization",
      facility: "CoWIN · Govt. Urban Health Centre",
      detail: "Batch 4120Z. No adverse events reported.",
    },
    {
      id: "TL-6",
      date: "2019-11-11",
      title: "Tetanus Toxoid Booster",
      kind: "immunization",
      facility: "PHC Indiranagar",
      detail: "Routine booster, next due 2029.",
    },
  ],
  documents: [
    {
      id: "DOC-1",
      name: "HbA1c & Lipid Panel",
      type: "Lab Report",
      date: dayOffset(30),
      facility: "Apollo Diagnostics",
      size: "412 KB",
      summary: "HbA1c 7.4% · LDL 118 mg/dL · Triglycerides 164 mg/dL · Fasting glucose 132 mg/dL",
    },
    {
      id: "DOC-2",
      name: "Prescription — Endocrinology",
      type: "Prescription",
      date: dayOffset(7),
      facility: "Manipal Hospital",
      size: "128 KB",
      summary: "Metformin 500mg BD × 90 days, Amlodipine 5mg OD × 90 days. Penicillin flagged as allergy.",
    },
    {
      id: "DOC-3",
      name: "Chest X-Ray PA View",
      type: "Radiology",
      date: dayOffset(95),
      facility: "Manipal Radiology",
      size: "2.1 MB",
      summary: "Clear lung fields. No focal consolidation. Cardiac silhouette within normal limits.",
    },
    {
      id: "DOC-4",
      name: "Discharge Summary — Appendectomy",
      type: "Discharge Summary",
      date: "2023-06-20",
      facility: "Manipal Hospital",
      size: "340 KB",
      summary: "Post-op day 2 discharge. Antibiotic: Cefixime (penicillin avoided). Sutures removed day 7.",
    },
  ],
  prescriptions: [],
  consents: [
    {
      id: "CON-1",
      requester: "Manipal Hospital · Dept. of Endocrinology",
      purpose: "Ongoing care & treatment",
      scopes: ["Diagnostics", "Prescriptions", "Vitals"],
      requestedOn: dayOffset(9),
      expiry: "12 months",
      status: "active",
    },
    {
      id: "CON-2",
      requester: "Star Health Insurance",
      purpose: "Claim adjudication",
      scopes: ["Discharge Summary", "Diagnostics"],
      requestedOn: dayOffset(2),
      expiry: "30 days",
      status: "pending",
    },
    {
      id: "CON-3",
      requester: "ICMR Diabetes Cohort Study",
      purpose: "De-identified research",
      scopes: ["Vitals", "Diagnostics"],
      requestedOn: dayOffset(1),
      expiry: "6 months",
      status: "pending",
    },
    {
      id: "CON-4",
      requester: "Apollo Diagnostics",
      purpose: "Report delivery",
      scopes: ["Diagnostics"],
      requestedOn: dayOffset(40),
      expiry: "3 months",
      status: "active",
    },
  ],
  audit: initialAuditSeed,
  queue: [
    { id: "SS-10024", name: "Rahul Sharma", age: 42, gender: "Male", abha: "12-3456-7890-1024", reason: "Diabetes follow-up", token: 12, status: "waiting" },
    { id: "SS-10031", name: "Anita Desai", age: 34, gender: "Female", abha: "12-3456-7890-1031", reason: "Antenatal check", token: 13, status: "waiting" },
    { id: "SS-10042", name: "Mohammed Farhan", age: 57, gender: "Male", abha: "12-3456-7890-1042", reason: "Chest discomfort", token: 14, status: "waiting" },
    { id: "SS-10055", name: "Lakshmi Rao", age: 68, gender: "Female", abha: "12-3456-7890-1055", reason: "Knee pain review", token: 15, status: "waiting" },
  ],
  syncQueue: [],
  online: true,
  notifications: [
    { id: "N1", title: "New consent request", body: "Star Health Insurance requested claim data.", time: "2h ago", read: false },
    { id: "N2", title: "Lab report available", body: "HbA1c & Lipid Panel added to your locker.", time: "1d ago", read: false },
    { id: "N3", title: "Medication reminder", body: "Amlodipine 5mg — morning dose.", time: "1d ago", read: true },
  ],
  clinicalNotes: [
    {
      id: "CN-1",
      date: dayOffset(7),
      author: "Dr. Meera Iyer, Endocrinology",
      text: "Glycaemic control improving on Metformin. BP trending down on Amlodipine. Reinforced diet and 30-min daily walk. Penicillin allergy re-confirmed with patient.",
    },
  ],
  appointments: [
    { id: "AP-1", date: dayOffset(-14).slice(0, 10), time: "10:30 AM", doctor: "Dr. Meera Iyer", dept: "Endocrinology", mode: "In-person" },
    { id: "AP-2", date: dayOffset(-35).slice(0, 10), time: "04:00 PM", doctor: "Dr. Arun Kamath", dept: "Cardiology", mode: "Teleconsult" },
  ],
  demoStep: 0,
  demoScenario: "roadside",
};

const KEY = "swasthyasetu-state-v1";

type Ctx = {
  state: AppState;
  set: (updater: (s: AppState) => AppState) => void;
  logAudit: (entry: { actor: string; action: string; scope: string; location?: string; override?: boolean }) => void;
  reset: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initialState, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const set = useCallback((updater: (s: AppState) => AppState) => {
    setState((s) => updater(s));
  }, []);

  const logAudit = useCallback<Ctx["logAudit"]>((entry) => {
    setState((s) => {
      const prev = s.audit.length ? s.audit[s.audit.length - 1].hash : "0000000000000";
      const hash = shortHash(prev + entry.actor + entry.action + s.audit.length);
      return {
        ...s,
        audit: [
          ...s.audit,
          {
            id: `AUD-${1000 + s.audit.length}`,
            time: nowStamp(),
            actor: entry.actor,
            action: entry.action,
            scope: entry.scope,
            location: entry.location ?? "Bengaluru, KA",
            override: entry.override ?? false,
            prevHash: prev,
            hash,
          },
        ],
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ state, set, logAudit, reset }), [state, set, logAudit, reset]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function healthScore(state: AppState) {
  const v = state.vitals[state.vitals.length - 1];
  if (!v) return 70;
  let score = 100;
  score -= Math.max(0, v.systolic - 120) * 0.35;
  score -= Math.max(0, v.diastolic - 80) * 0.4;
  score -= Math.max(0, v.glucose - 110) * 0.18;
  score -= state.conditionsPenalty ?? 0;
  score -= state.patient.conditions.length * 3;
  return Math.max(35, Math.min(99, Math.round(score)));
}
