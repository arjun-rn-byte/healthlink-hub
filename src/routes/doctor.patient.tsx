import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ClipboardList, NotebookPen, Stethoscope } from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { VitalsChart } from "@/components/VitalsChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore, nowStamp } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/doctor/patient")({
  head: () => ({
    meta: [
      { title: "Clinical Patient Summary — SWASTHYASETU" },
      {
        name: "description",
        content:
          "Longitudinal clinical summary with vitals charts, allergies, diagnoses, prescriptions and clinical notes.",
      },
      { property: "og:title", content: "Clinical Patient Summary — SWASTHYASETU" },
      { property: "og:description", content: "Longitudinal vitals, allergies and clinical notes." },
    ],
  }),
  component: DoctorPatient,
});

function DoctorPatient() {
  const { state, set, logAudit } = useStore();
  const { patient } = state;
  const [note, setNote] = useState("");
  const latest = state.vitals[state.vitals.length - 1];

  const addNote = () => {
    if (!note.trim()) {
      toast.error("Write a note before saving");
      return;
    }
    set((s) => ({
      ...s,
      clinicalNotes: [
        {
          id: `CN-${Date.now()}`,
          date: nowStamp().slice(0, 10),
          author: "Dr. Meera Iyer, Endocrinology",
          text: note.trim(),
        },
        ...s.clinicalNotes,
      ],
    }));
    logAudit({ actor: "Dr. Meera Iyer", action: "Clinical note added", scope: patient.id });
    setNote("");
    toast.success("Clinical note saved to the shared record");
  };

  return (
    <AppShell
      title={`${patient.name} · ${patient.age}${patient.gender[0]}`}
      description={`${patient.id} · ABHA ${patient.abha} · Blood group ${patient.bloodGroup} · ${patient.insurance}`}
      actions={
        <Button asChild>
          <Link to="/doctor/consultation">
            <Stethoscope className="size-4" /> Open consultation
          </Link>
        </Button>
      }
    >
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <AlertTriangle className="size-4" /> ALLERGY: {patient.allergies.join(", ")} — do not prescribe
          beta-lactams
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/15 px-4 py-3 text-sm font-medium">
          Chronic: {patient.conditions.join(" · ")}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Longitudinal trends</CardTitle>
            <CardDescription>Data pooled from three facilities under active consent</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="bp">
              <TabsList>
                <TabsTrigger value="bp">Blood pressure</TabsTrigger>
                <TabsTrigger value="glucose">Glucose</TabsTrigger>
                <TabsTrigger value="weight">Weight & SpO₂</TabsTrigger>
              </TabsList>
              <TabsContent value="bp" className="mt-4">
                <VitalsChart
                  data={state.vitals}
                  series={[
                    { key: "systolic", label: "Systolic" },
                    { key: "diastolic", label: "Diastolic" },
                  ]}
                />
              </TabsContent>
              <TabsContent value="glucose" className="mt-4">
                <VitalsChart data={state.vitals} series={[{ key: "glucose", label: "Fasting glucose" }]} />
              </TabsContent>
              <TabsContent value="weight" className="mt-4">
                <VitalsChart
                  data={state.vitals}
                  series={[
                    { key: "weight", label: "Weight (kg)" },
                    { key: "spo2", label: "SpO₂ (%)" },
                  ]}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest recorded</CardTitle>
            <CardDescription>{latest.date}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["BP", `${latest.systolic}/${latest.diastolic}`],
              ["Glucose", `${latest.glucose} mg/dL`],
              ["Pulse", `${latest.pulse} bpm`],
              ["SpO₂", `${latest.spo2}%`],
              ["Weight", `${latest.weight} kg`],
              ["HbA1c", "7.4%"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="text-lg font-semibold">{v}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Problem list & medication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {patient.conditions.map((c) => (
              <div key={c} className="flex items-center justify-between rounded-md border border-border p-2.5">
                <span>{c}</span>
                <StatBadge tone="warn">active</StatBadge>
              </div>
            ))}
            {patient.medications.map((m) => (
              <div key={m.name} className="rounded-md border border-border p-2.5">
                <p className="font-medium">
                  {m.name} {m.dose}
                </p>
                <p className="text-xs text-muted-foreground">{m.frequency}</p>
              </div>
            ))}
            <div className="rounded-md border border-border p-2.5">
              <p className="font-medium">Past surgery</p>
              {patient.surgeries.map((s) => (
                <p key={s.name} className="text-xs text-muted-foreground">
                  {s.name} ({s.year})
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <NotebookPen className="size-4" /> Clinical notes
            </CardTitle>
            <CardDescription>Visible to the patient and to consented clinicians</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={3}
              placeholder="Add an assessment, plan or observation…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button onClick={addNote}>
              <ClipboardList className="size-4" /> Save note
            </Button>
            <div className="space-y-3">
              {state.clinicalNotes.map((n) => (
                <div key={n.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{n.author}</span>
                    <span>· {n.date}</span>
                  </div>
                  <p className="mt-1.5">{n.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {state.prescriptions.length > 0 && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="text-base">Prescriptions issued in this session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {state.prescriptions.map((p) => (
              <div key={p.id} className="rounded-md border border-border p-3">
                <p className="font-medium">
                  {p.date} · {p.diagnosis}
                </p>
                <p className="text-muted-foreground">
                  {p.medicines.map((m) => `${m.name} ${m.dose} ${m.frequency}`).join(" · ")}
                </p>
                {p.labOrders.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">Labs: {p.labOrders.join(", ")}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
