import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  CalendarClock,
  Droplets,
  FileText,
  HeartPulse,
  Pill,
  Plus,
  QrCode,
  Share2,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { VitalsChart } from "@/components/VitalsChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { healthScore, useStore, nowStamp } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [
      { title: "Patient Health Dashboard — SWASTHYASETU" },
      {
        name: "description",
        content:
          "Track vitals, health score, medications and upcoming visits in one consent-controlled patient dashboard.",
      },
      { property: "og:title", content: "Patient Health Dashboard — SWASTHYASETU" },
      {
        property: "og:description",
        content: "Vitals, health score, medications and upcoming visits in one place.",
      },
    ],
  }),
  component: PatientDashboard,
});

function PatientDashboard() {
  const { state, set, logAudit } = useStore();
  const { patient } = state;
  const latest = lastVital(state);
  const prev = prevVital(state);
  const score = healthScore(state);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [form, setForm] = useState({
    systolic: String(latest.systolic),
    diastolic: String(latest.diastolic),
    glucose: String(latest.glucose),
    pulse: String(latest.pulse),
    weight: String(latest.weight),
    spo2: String(latest.spo2),
  });

  const saveVitals = () => {
    const entry = {
      date: new Date().toISOString().slice(0, 10),
      systolic: Number(form.systolic) || latest.systolic,
      diastolic: Number(form.diastolic) || latest.diastolic,
      glucose: Number(form.glucose) || latest.glucose,
      pulse: Number(form.pulse) || latest.pulse,
      weight: Number(form.weight) || latest.weight,
      spo2: Number(form.spo2) || latest.spo2,
    };
    set((s) => ({
      ...s,
      vitals: [...s.vitals, entry],
      syncQueue: s.online
        ? s.syncQueue
        : [
            ...s.syncQueue,
            {
              id: `SYNC-${Date.now()}`,
              label: "Self-recorded vitals",
              kind: "vitals",
              createdAt: nowStamp(),
              status: "queued" as const,
            },
          ],
    }));
    logAudit({ actor: "Rahul Sharma (self)", action: "Vitals recorded", scope: "Vitals" });
    setVitalsOpen(false);
    toast.success(state.online ? "Vitals saved to your record" : "Vitals cached — will sync when online");
  };

  const delta = (a: number, b: number) => {
    const d = a - b;
    return d === 0 ? "no change" : `${d > 0 ? "+" : ""}${d.toFixed(0)} vs last`;
  };

  return (
    <AppShell
      title={`Namaste, ${patient.name.split(" ")[0]}`}
      description={`ABHA ${patient.abha} · ${patient.age}${patient.gender[0]} · Blood group ${patient.bloodGroup} · Preferred language ${patient.language}`}
      actions={
        <>
          <Button variant="outline" onClick={() => setVitalsOpen(true)}>
            <Plus className="size-4" /> Record vitals
          </Button>
          <Button asChild>
            <Link to="/patient/emergency-profile">
              <QrCode className="size-4" /> Emergency card
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Vitals trend</CardTitle>
              <CardDescription>Blood pressure and fasting glucose over the last 5 months</CardDescription>
            </div>
            <StatBadge tone="good">
              <TrendingDown className="size-3" /> Improving
            </StatBadge>
          </CardHeader>
          <CardContent>
            <VitalsChart
              data={state.vitals}
              series={[
                { key: "systolic", label: "Systolic BP" },
                { key: "diastolic", label: "Diastolic BP" },
                { key: "glucose", label: "Fasting glucose" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Health score</CardTitle>
            <CardDescription>Composite of BP, glucose and chronic load</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-primary">{score}</span>
              <span className="pb-2 text-sm text-muted-foreground">/ 100</span>
            </div>
            <Progress value={score} />
            <p className="text-sm text-muted-foreground">
              {score >= 75
                ? "Well controlled. Keep up medication adherence and daily walks."
                : "Moderate risk. Follow-up with your endocrinologist is recommended."}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="rounded-md border border-border p-2">
                <p className="text-muted-foreground">Adherence</p>
                <p className="text-base font-semibold">92%</p>
              </div>
              <div className="rounded-md border border-border p-2">
                <p className="text-muted-foreground">Consents active</p>
                <p className="text-base font-semibold">
                  {state.consents.filter((c) => c.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Blood pressure",
            value: `${latest.systolic}/${latest.diastolic}`,
            unit: "mmHg",
            note: delta(latest.systolic, prev.systolic),
            tone: latest.systolic > 130 ? ("warn" as const) : ("good" as const),
            icon: HeartPulse,
          },
          {
            label: "Fasting glucose",
            value: String(latest.glucose),
            unit: "mg/dL",
            note: delta(latest.glucose, prev.glucose),
            tone: latest.glucose > 125 ? ("warn" as const) : ("good" as const),
            icon: Droplets,
          },
          {
            label: "Pulse",
            value: String(latest.pulse),
            unit: "bpm",
            note: delta(latest.pulse, prev.pulse),
            tone: "good" as const,
            icon: Activity,
          },
          {
            label: "SpO₂",
            value: String(latest.spo2),
            unit: "%",
            note: delta(latest.spo2, prev.spo2),
            tone: "good" as const,
            icon: Activity,
          },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <m.icon className="size-4 text-primary" />
              </div>
              <p className="mt-2 text-3xl font-bold">
                {m.value}
                <span className="ml-1 text-sm font-normal text-muted-foreground">{m.unit}</span>
              </p>
              <div className="mt-2">
                <StatBadge tone={m.tone}>{m.note}</StatBadge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current medications</CardTitle>
            <CardDescription>Prescribed and active</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.medications.map((m) => (
              <div key={m.name} className="flex items-start gap-3 rounded-md border border-border p-3">
                <Pill className="mt-0.5 size-4 text-accent" />
                <div className="text-sm">
                  <p className="font-medium">
                    {m.name} · {m.dose}
                  </p>
                  <p className="text-muted-foreground">{m.frequency}</p>
                </div>
              </div>
            ))}
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-semibold">Allergy on file: {patient.allergies.join(", ")}</p>
              <p className="mt-0.5">Every prescribing screen blocks this drug class automatically.</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast.success("Refill request sent to Manipal Pharmacy")}
            >
              Request refill
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming visits</CardTitle>
            <CardDescription>Scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.appointments.map((a) => (
              <div key={a.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-primary" />
                  <p className="font-medium">
                    {a.date} · {a.time}
                  </p>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {a.doctor} — {a.dept} ({a.mode})
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success(`Reminder set for ${a.date}`)}
                  >
                    Remind me
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      set((s) => ({ ...s, appointments: s.appointments.filter((x) => x.id !== a.id) }));
                      toast("Appointment cancelled", { description: `${a.doctor} · ${a.dept}` });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
            {state.appointments.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 21);
                set((s) => ({
                  ...s,
                  appointments: [
                    ...s.appointments,
                    {
                      id: `AP-${Date.now()}`,
                      date: d.toISOString().slice(0, 10),
                      time: "11:15 AM",
                      doctor: "Dr. Meera Iyer",
                      dept: "Endocrinology",
                      mode: "In-person",
                    },
                  ],
                }));
                toast.success("Appointment booked with Dr. Meera Iyer");
              }}
            >
              <Plus className="size-4" /> Book appointment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
            <CardDescription>Everything a patient needs in one tap</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/patient/documents">
                <FileText className="size-4" /> Open health locker
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/patient/history">
                <Activity className="size-4" /> View medical timeline
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/consent">
                <ShieldCheck className="size-4" /> Manage consents
                {state.consents.filter((c) => c.status === "pending").length > 0 && (
                  <span className="ml-auto rounded-full bg-destructive px-2 text-xs text-destructive-foreground">
                    {state.consents.filter((c) => c.status === "pending").length}
                  </span>
                )}
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                logAudit({
                  actor: "Rahul Sharma (self)",
                  action: "Record shared via secure link",
                  scope: "Summary",
                });
                toast.success("Secure share link valid for 24 hours copied");
              }}
            >
              <Share2 className="size-4" /> Share record with a doctor
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={vitalsOpen} onOpenChange={setVitalsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record today's vitals</DialogTitle>
            <DialogDescription>
              Values are added to your longitudinal record and visible to consented clinicians.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["systolic", "Systolic (mmHg)"],
                ["diastolic", "Diastolic (mmHg)"],
                ["glucose", "Fasting glucose (mg/dL)"],
                ["pulse", "Pulse (bpm)"],
                ["weight", "Weight (kg)"],
                ["spo2", "SpO₂ (%)"],
              ] as const
            ).map(([k, label]) => (
              <div key={k} className="space-y-1.5">
                <Label htmlFor={k}>{label}</Label>
                <Input
                  id={k}
                  inputMode="numeric"
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVitalsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveVitals}>Save to record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
