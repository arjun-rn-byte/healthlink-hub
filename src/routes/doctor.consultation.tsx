import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, FlaskConical, Plus, Trash2 } from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore, nowStamp } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/doctor/consultation")({
  head: () => ({
    meta: [
      { title: "Active Consultation — SWASTHYASETU" },
      {
        name: "description",
        content:
          "Record vitals, write allergy-checked digital prescriptions, raise lab orders and update the diagnosis live.",
      },
      { property: "og:title", content: "Active Consultation — SWASTHYASETU" },
      { property: "og:description", content: "Vitals, digital prescriptions and lab orders in real time." },
    ],
  }),
  component: Consultation,
});

const labCatalogue = ["HbA1c", "Lipid profile", "Serum creatinine", "Fundus screening", "ECG", "Urine microalbumin"];

function Consultation() {
  const { state, set, logAudit } = useStore();
  const { patient } = state;
  const latest = lastVital(state);
  const active = state.queue.find((p) => p.status === "in-consult") ?? state.queue[0];

  const [vitals, setVitals] = useState({
    systolic: String(latest.systolic),
    diastolic: String(latest.diastolic),
    glucose: String(latest.glucose),
    pulse: String(latest.pulse),
    weight: String(latest.weight),
    spo2: String(latest.spo2),
  });
  const [diagnosis, setDiagnosis] = useState(patient.conditions.join(", "));
  const [notes, setNotes] = useState("");
  const [labs, setLabs] = useState<string[]>(["HbA1c"]);
  const [meds, setMeds] = useState([
    { name: "Metformin", dose: "500 mg", frequency: "BD after meals", duration: "90 days" },
  ]);
  const [draft, setDraft] = useState({ name: "", dose: "", frequency: "OD", duration: "30 days" });

  const allergyHit = draft.name.trim().length > 2 &&
    ["penicillin", "amoxicillin", "ampicillin", "augmentin", "cloxacillin"].some((a) =>
      a.includes(draft.name.trim().toLowerCase()) || draft.name.trim().toLowerCase().includes(a),
    );

  const addMed = () => {
    if (!draft.name.trim() || !draft.dose.trim()) {
      toast.error("Medicine name and dose are required");
      return;
    }
    if (allergyHit) {
      toast.error(`Blocked: ${patient.name} is allergic to Penicillin`);
      return;
    }
    setMeds([...meds, { ...draft, name: draft.name.trim(), dose: draft.dose.trim() }]);
    setDraft({ name: "", dose: "", frequency: "OD", duration: "30 days" });
    toast.success("Medicine added to prescription");
  };

  const saveVitals = () => {
    set((s) => ({
      ...s,
      vitals: [
        ...s.vitals,
        {
          date: new Date().toISOString().slice(0, 10),
          systolic: Number(vitals.systolic) || latest.systolic,
          diastolic: Number(vitals.diastolic) || latest.diastolic,
          glucose: Number(vitals.glucose) || latest.glucose,
          pulse: Number(vitals.pulse) || latest.pulse,
          weight: Number(vitals.weight) || latest.weight,
          spo2: Number(vitals.spo2) || latest.spo2,
        },
      ],
    }));
    logAudit({ actor: "Dr. Meera Iyer", action: "Vitals recorded in consult", scope: patient.id });
    toast.success("Vitals added to the longitudinal record");
  };

  const signAndClose = () => {
    if (meds.length === 0) {
      toast.error("Add at least one medicine before signing");
      return;
    }
    const rx = {
      id: `RX-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      doctor: "Dr. Meera Iyer, Endocrinology",
      diagnosis,
      medicines: meds,
      labOrders: labs,
      notes,
    };
    set((s) => ({
      ...s,
      prescriptions: [rx, ...s.prescriptions],
      patient: { ...s.patient, conditions: diagnosis.split(",").map((c) => c.trim()).filter(Boolean) },
      documents: [
        {
          id: `DOC-${Date.now()}`,
          name: `Prescription — ${rx.date}`,
          type: "Prescription" as const,
          date: rx.date,
          facility: "Manipal Hospital",
          size: "96 KB",
          summary: `${rx.medicines.map((m) => `${m.name} ${m.dose} ${m.frequency}`).join("; ")}. Labs: ${
            rx.labOrders.join(", ") || "none"
          }.`,
        },
        ...s.documents,
      ],
      clinicalNotes: notes.trim()
        ? [
            { id: `CN-${Date.now()}`, date: rx.date, author: rx.doctor, text: notes.trim() },
            ...s.clinicalNotes,
          ]
        : s.clinicalNotes,
      queue: s.queue.map((p) => (p.id === active?.id ? { ...p, status: "done" as const } : p)),
      timeline: [
        {
          id: `TL-${Date.now()}`,
          date: rx.date,
          title: "OPD consultation — Endocrinology",
          kind: "visit" as const,
          facility: "Manipal Hospital, Bengaluru",
          detail: notes.trim() || `Prescription issued for ${diagnosis}.`,
        },
        ...s.timeline,
      ],
      syncQueue: s.online
        ? s.syncQueue
        : [
            ...s.syncQueue,
            {
              id: `SYNC-${Date.now()}`,
              label: "Signed prescription",
              kind: "prescription",
              createdAt: nowStamp(),
              status: "queued" as const,
            },
          ],
      notifications: [
        {
          id: `N-${Date.now()}`,
          title: "New prescription issued",
          body: `Dr. Meera Iyer signed a prescription for ${diagnosis}.`,
          time: "just now",
          read: false,
        },
        ...s.notifications,
      ],
    }));
    logAudit({ actor: "Dr. Meera Iyer", action: "Prescription signed & consult closed", scope: patient.id });
    toast.success("Consultation closed — record updated everywhere");
  };

  return (
    <AppShell
      title="Active consultation"
      description={`${patient.name} · ${patient.id} · Token ${active?.token ?? "—"} · Dr. Meera Iyer, Endocrinology`}
      actions={
        <Button onClick={signAndClose}>
          <CheckCircle2 className="size-4" /> Sign & close consult
        </Button>
      }
    >
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
        <AlertTriangle className="size-4" /> Allergy guard active — Penicillin class prescriptions are blocked
        for this patient
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vitals this visit</CardTitle>
            <CardDescription>Recorded by nursing station</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["systolic", "Systolic"],
                  ["diastolic", "Diastolic"],
                  ["glucose", "Glucose"],
                  ["pulse", "Pulse"],
                  ["weight", "Weight"],
                  ["spo2", "SpO₂"],
                ] as const
              ).map(([k, l]) => (
                <div key={k} className="space-y-1.5">
                  <Label htmlFor={`c-${k}`}>{l}</Label>
                  <Input
                    id={`c-${k}`}
                    inputMode="numeric"
                    value={vitals[k]}
                    onChange={(e) => setVitals({ ...vitals, [k]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={saveVitals}>
              Save vitals
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Digital prescription</CardTitle>
            <CardDescription>Signed with the clinician's registered HPR identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dx">Working diagnosis</Label>
              <Input id="dx" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
            </div>

            <div className="space-y-2">
              {meds.map((m, i) => (
                <div key={`${m.name}-${i}`} className="flex items-center gap-3 rounded-md border border-border p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {m.name} · {m.dose}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.frequency} · {m.duration}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setMeds(meds.filter((_, idx) => idx !== i));
                      toast("Medicine removed");
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="med">Medicine</Label>
                <Input
                  id="med"
                  placeholder="e.g. Amlodipine"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dose">Dose</Label>
                <Input
                  id="dose"
                  placeholder="5 mg"
                  value={draft.dose}
                  onChange={(e) => setDraft({ ...draft, dose: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="freq">Frequency</Label>
                <Input
                  id="freq"
                  value={draft.frequency}
                  onChange={(e) => setDraft({ ...draft, frequency: e.target.value })}
                />
              </div>
            </div>
            {allergyHit && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm font-medium text-destructive">
                <AlertTriangle className="size-4" /> Contraindicated — patient is allergic to Penicillin.
              </div>
            )}
            <Button variant="outline" onClick={addMed}>
              <Plus className="size-4" /> Add medicine
            </Button>

            <div className="space-y-1.5">
              <Label htmlFor="cnotes">Consultation notes</Label>
              <Textarea
                id="cnotes"
                rows={3}
                placeholder="Assessment and plan…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="size-4" /> Lab orders
          </CardTitle>
          <CardDescription>Selected tests are pushed to the hospital LIS on signing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {labCatalogue.map((l) => (
              <label
                key={l}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 text-sm hover:bg-secondary"
              >
                <Checkbox
                  checked={labs.includes(l)}
                  onCheckedChange={(v) =>
                    setLabs(v ? [...labs, l] : labs.filter((x) => x !== l))
                  }
                />
                {l}
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatBadge tone="info">{labs.length} test(s) selected</StatBadge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (labs.length === 0) {
                  toast.error("Select at least one test");
                  return;
                }
                logAudit({ actor: "Dr. Meera Iyer", action: "Lab order raised", scope: labs.join(", ") });
                toast.success(`Lab order sent: ${labs.join(", ")}`);
              }}
            >
              Send order to lab
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
