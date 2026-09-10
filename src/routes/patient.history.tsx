import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, FlaskConical, Hospital, Scissors, Stethoscope, Syringe } from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore, type TimelineEvent } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/patient/history")({
  head: () => ({
    meta: [
      { title: "Medical History Timeline — SWASTHYASETU" },
      {
        name: "description",
        content:
          "A single longitudinal timeline of diagnoses, hospital visits, surgeries, immunisations and lab results.",
      },
      { property: "og:title", content: "Medical History Timeline — SWASTHYASETU" },
      {
        property: "og:description",
        content: "Diagnoses, visits, surgeries, immunisations and labs in one timeline.",
      },
    ],
  }),
  component: HistoryPage,
});

const kindMeta: Record<TimelineEvent["kind"], { icon: typeof Activity; label: string; tone: "info" | "warn" | "good" | "neutral" }> = {
  diagnosis: { icon: Stethoscope, label: "Diagnosis", tone: "warn" },
  visit: { icon: Hospital, label: "Visit", tone: "info" },
  surgery: { icon: Scissors, label: "Surgery", tone: "neutral" },
  immunization: { icon: Syringe, label: "Immunisation", tone: "good" },
  lab: { icon: FlaskConical, label: "Lab", tone: "info" },
};

function HistoryPage() {
  const { state, logAudit } = useStore();
  const [filter, setFilter] = useState<"all" | TimelineEvent["kind"]>("all");

  const sorted = [...state.timeline].sort((a, b) => (a.date < b.date ? 1 : -1));
  const shown = filter === "all" ? sorted : sorted.filter((e) => e.kind === filter);

  return (
    <AppShell
      title="Medical history"
      description="Every encounter across hospitals, labs and public health programmes, stitched into one verifiable timeline."
      actions={
        <Button
          variant="outline"
          onClick={() => {
            logAudit({
              actor: "Rahul Sharma (self)",
              action: "Timeline exported as PDF",
              scope: "Full history",
            });
            toast.success("History exported — file queued to your device");
          }}
        >
          Export timeline
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Longitudinal timeline</CardTitle>
              <CardDescription>{shown.length} records shown</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList className="flex-wrap">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="diagnosis">Diagnoses</TabsTrigger>
                  <TabsTrigger value="visit">Visits</TabsTrigger>
                  <TabsTrigger value="surgery">Surgical</TabsTrigger>
                  <TabsTrigger value="immunization">Immunisation</TabsTrigger>
                  <TabsTrigger value="lab">Labs</TabsTrigger>
                </TabsList>
                <TabsContent value={filter} className="mt-5">
                  <ol className="relative space-y-5 border-l border-border pl-6">
                    {shown.map((e) => {
                      const meta = kindMeta[e.kind];
                      return (
                        <li key={e.id} className="relative">
                          <span className="absolute -left-[34px] flex size-6 items-center justify-center rounded-full border border-border bg-card text-primary">
                            <meta.icon className="size-3.5" />
                          </span>
                          <div className="rounded-lg border border-border bg-card p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{e.title}</p>
                              <StatBadge tone={meta.tone}>{meta.label}</StatBadge>
                              <span className="ml-auto text-xs text-muted-foreground">{e.date}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{e.facility}</p>
                            <p className="mt-2 text-sm">{e.detail}</p>
                          </div>
                        </li>
                      );
                    })}
                    {shown.length === 0 && (
                      <li className="text-sm text-muted-foreground">No records in this category.</li>
                    )}
                  </ol>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active diagnoses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {state.patient.conditions.map((c) => (
                <div key={c} className="flex items-center justify-between rounded-md border border-border p-3">
                  <span className="font-medium">{c}</span>
                  <StatBadge tone="warn">Chronic</StatBadge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Surgical history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {state.patient.surgeries.map((s) => (
                <div key={s.name} className="rounded-md border border-border p-3">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-muted-foreground">Performed {s.year} · No complications</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Immunisation record</CardTitle>
              <CardDescription>Synced from CoWIN & U-WIN</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {sorted
                .filter((e) => e.kind === "immunization")
                .map((e) => (
                  <div key={e.id} className="rounded-md border border-border p-3">
                    <p className="font-medium">{e.title}</p>
                    <p className="text-muted-foreground">
                      {e.date} · {e.facility}
                    </p>
                  </div>
                ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => toast.success("Re-synced with national immunisation registry")}
              >
                Re-sync registry
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Known allergies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-semibold">{state.patient.allergies.join(", ")}</p>
                <p className="mt-1">Severe reaction documented in 2018. Avoid all beta-lactams.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
