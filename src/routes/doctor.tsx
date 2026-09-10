import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, Search, Stethoscope, UserRound, Users } from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "OPD Workspace — SWASTHYASETU" },
      {
        name: "description",
        content:
          "Clinician workspace with live OPD queue, ABHA/patient ID search and instant access to consented records.",
      },
      { property: "og:title", content: "OPD Workspace — SWASTHYASETU" },
      { property: "og:description", content: "Live OPD queue and ABHA search for clinicians." },
    ],
  }),
  component: DoctorWorkspace,
});

function DoctorWorkspace() {
  const { state, set, logAudit } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const waiting = state.queue.filter((p) => p.status === "waiting");
  const inConsult = state.queue.filter((p) => p.status === "in-consult");
  const done = state.queue.filter((p) => p.status === "done");

  const search = () => {
    const term = q.trim().toLowerCase();
    if (!term) {
      toast.error("Enter an ABHA number, patient ID or name");
      return;
    }
    const hit = state.queue.find(
      (p) =>
        p.abha.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term),
    );
    if (hit) {
      setResult(`${hit.name} · ${hit.id} · ABHA ${hit.abha}`);
      logAudit({ actor: "Dr. Ananya Rao", action: "Patient record searched", scope: hit.id });
      toast.success(`Record found: ${hit.name}`);
    } else {
      setResult(null);
      toast.error("No linked record found for that identifier");
    }
  };

  const startConsult = (id: string) => {
    set((s) => ({
      ...s,
      queue: s.queue.map((p) =>
        p.id === id ? { ...p, status: "in-consult" as const } : p.status === "in-consult" ? { ...p, status: "waiting" as const } : p,
      ),
    }));
    logAudit({ actor: "Dr. Ananya Rao", action: "Consultation started", scope: id });
    navigate({ to: "/doctor/consultation" });
  };

  return (
    <AppShell
      title="OPD workspace"
      description="Dr. Ananya Rao · Endocrinology · Manipal Hospital, Bengaluru · Room 214"
      actions={
        <Button variant="outline" onClick={() => toast.success("Queue refreshed from hospital HIS")}>
          Refresh queue
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Waiting", value: waiting.length, icon: Users },
          { label: "In consultation", value: inConsult.length, icon: Stethoscope },
          { label: "Completed today", value: done.length, icon: CalendarClock },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Today's OPD queue</CardTitle>
            <CardDescription>Token order · pulled from hospital HIS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.queue.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
              >
                <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-sm font-bold">
                  {p.token}
                </span>
                <div className="min-w-40">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.age}/{p.gender[0]} · {p.id} · {p.reason}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <StatBadge
                    tone={p.status === "done" ? "good" : p.status === "in-consult" ? "info" : "neutral"}
                  >
                    {p.status}
                  </StatBadge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      logAudit({ actor: "Dr. Ananya Rao", action: "Record opened", scope: p.id });
                      navigate({ to: "/doctor/patient" });
                    }}
                  >
                    View record
                  </Button>
                  <Button size="sm" onClick={() => startConsult(p.id)}>
                    Start consult
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Find a patient</CardTitle>
              <CardDescription>Search by ABHA number, SWASTHYASETU ID or name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="12-3456-7890-1024"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                />
                <Button onClick={search}>
                  <Search className="size-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["SS-10024", "Anita", "12-3456-7890-1042"].map((s) => (
                  <button
                    key={s}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary"
                    onClick={() => setQ(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {result && (
                <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
                  <p className="font-medium">{result}</p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate({ to: "/doctor/patient" })}
                  >
                    <UserRound className="size-4" /> Open clinical summary
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consent status</CardTitle>
              <CardDescription>Your access to Rahul Sharma's record</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Diagnostics</span>
                <StatBadge tone="good">granted</StatBadge>
              </div>
              <div className="flex items-center justify-between">
                <span>Prescriptions</span>
                <StatBadge tone="good">granted</StatBadge>
              </div>
              <div className="flex items-center justify-between">
                <span>Vitals</span>
                <StatBadge tone="good">granted</StatBadge>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                Consent expires in 12 months. All reads are written to the patient's audit log.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
