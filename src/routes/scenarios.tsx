import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Play, RotateCcw, Timer } from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore, type Role } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/scenarios")({
  head: () => ({
    meta: [
      { title: "Judge Demo Script — SWASTHYASETU" },
      {
        name: "description",
        content:
          "A guided five-minute demo runner for Smart India Hackathon judges: step through the emergency, consultation and offline journeys.",
      },
      { property: "og:title", content: "Judge Demo Script — SWASTHYASETU" },
      {
        property: "og:description",
        content: "Step through the emergency, consultation and offline journeys in five minutes.",
      },
    ],
  }),
  component: ScenariosPage,
});

type Step = { title: string; detail: string; to: string; role: Role; seconds: number };

const scenarios: Record<string, { name: string; tagline: string; steps: Step[] }> = {
  roadside: {
    name: "Roadside emergency",
    tagline: "An unconscious patient, 90 seconds, one scan.",
    steps: [
      {
        title: "Open the responder console",
        detail: "Show the triage portal a paramedic sees on a phone at the accident site.",
        to: "/emergency",
        role: "responder",
        seconds: 20,
      },
      {
        title: "Scan the emergency QR",
        detail: "Use the simulated scan or type SS-10024 to pull the critical record instantly.",
        to: "/emergency",
        role: "responder",
        seconds: 25,
      },
      {
        title: "Call out the life-saving facts",
        detail: "Blood group O+, penicillin allergy, diabetes and hypertension, emergency contact Priya.",
        to: "/emergency",
        role: "responder",
        seconds: 25,
      },
      {
        title: "Show the tamper-evident log",
        detail: "Every break-glass read is hash-chained; the patient is notified immediately.",
        to: "/emergency/log",
        role: "responder",
        seconds: 20,
      },
    ],
  },
  opd: {
    name: "OPD consultation",
    tagline: "Consent-gated access, allergy-safe prescribing.",
    steps: [
      {
        title: "Doctor opens the OPD queue",
        detail: "Search Rahul by health ID or ABHA address from the waiting list.",
        to: "/doctor",
        role: "doctor",
        seconds: 20,
      },
      {
        title: "Review the longitudinal record",
        detail: "Twelve months of BP and glucose in one chart, plus allergies and past surgery.",
        to: "/doctor/patient",
        role: "doctor",
        seconds: 30,
      },
      {
        title: "Run the live consultation",
        detail: "Record vitals, try prescribing penicillin and watch the allergy guard block it.",
        to: "/doctor/consultation",
        role: "doctor",
        seconds: 40,
      },
      {
        title: "Patient sees it instantly",
        detail: "Switch to the patient dashboard — the new prescription and timeline entry are already there.",
        to: "/patient",
        role: "patient",
        seconds: 20,
      },
    ],
  },
  consent: {
    name: "Consent & privacy",
    tagline: "The patient owns the record, not the hospital.",
    steps: [
      {
        title: "Open the consent manager",
        detail: "Pending, active and revoked consent artefacts, all scoped and time-bound.",
        to: "/consent",
        role: "patient",
        seconds: 25,
      },
      {
        title: "Approve and then revoke",
        detail: "Grant a request, then pull it back — access dies the moment consent does.",
        to: "/consent",
        role: "patient",
        seconds: 30,
      },
      {
        title: "Prove it in the audit ledger",
        detail: "Show the hash chain verification: no entry can be altered or deleted silently.",
        to: "/emergency/log",
        role: "patient",
        seconds: 25,
      },
    ],
  },
  rural: {
    name: "Rural offline visit",
    tagline: "Works where the network doesn't.",
    steps: [
      {
        title: "Switch the network off",
        detail: "Flip the simulator to offline — the record still loads from the encrypted cache.",
        to: "/offline",
        role: "patient",
        seconds: 20,
      },
      {
        title: "Do real work offline",
        detail: "Record vitals and a prescription; both land in the durable queue.",
        to: "/offline",
        role: "doctor",
        seconds: 30,
      },
      {
        title: "Reconnect and sync",
        detail: "Turn the network on and sync — the queue clears and the timeline merges.",
        to: "/offline",
        role: "doctor",
        seconds: 25,
      },
      {
        title: "Close on the blueprint",
        detail: "Show how idempotent writes and FHIR resources make this safe at national scale.",
        to: "/architecture",
        role: "judge",
        seconds: 25,
      },
    ],
  },
};

function ScenariosPage() {
  const { state, set, reset } = useStore();
  const navigate = useNavigate();
  const key = scenarios[state.demoScenario] ? state.demoScenario : "roadside";
  const scenario = scenarios[key]!;
  const step = Math.min(state.demoStep, scenario.steps.length - 1);
  const total = scenario.steps.reduce((a, s) => a + s.seconds, 0);

  const pick = (k: string) => set((s) => ({ ...s, demoScenario: k, demoStep: 0 }));
  const go = (i: number) => {
    const s = scenario.steps[i];
    if (!s) return;
    set((st) => ({ ...st, demoStep: i, role: s.role }));
    navigate({ to: s.to as never });
  };

  return (
    <AppShell
      title="Judge demo script"
      description="Four rehearsed journeys with one-click navigation and state resets, so a five-minute pitch never stalls."
      actions={
        <Button
          variant="outline"
          onClick={() => {
            reset();
            toast.success("Demo data reset to the canonical Rahul Sharma record");
          }}
        >
          <RotateCcw className="size-4" /> Reset demo data
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(scenarios).map(([k, s]) => (
          <button
            key={k}
            onClick={() => pick(k)}
            className={`rounded-xl border p-4 text-left transition ${
              k === key
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                : "border-border hover:border-primary/40 hover:bg-secondary/60"
            }`}
          >
            <p className="text-sm font-semibold">{s.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.tagline}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {s.steps.length} steps · {s.steps.reduce((a, x) => a + x.seconds, 0)}s
            </p>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">{scenario.name}</CardTitle>
                <CardDescription>{scenario.tagline}</CardDescription>
              </div>
              <StatBadge tone="info">
                <Timer className="size-3" /> {total}s total
              </StatBadge>
            </div>
            <Progress value={((step + 1) / scenario.steps.length) * 100} className="mt-3" />
          </CardHeader>
          <CardContent className="space-y-3">
            {scenario.steps.map((s, i) => (
              <div
                key={s.title}
                className={`rounded-lg border p-4 transition ${
                  i === step ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      i < step
                        ? "bg-primary/15 text-primary"
                        : i === step
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {i < step ? <CheckCircle2 className="size-4" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {s.to} · as {s.role} · {s.seconds}s
                    </p>
                  </div>
                  <Button size="sm" variant={i === step ? "default" : "outline"} onClick={() => go(i)}>
                    <Play className="size-4" /> Open
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                disabled={step === 0}
                onClick={() => set((s) => ({ ...s, demoStep: Math.max(0, step - 1) }))}
              >
                Previous
              </Button>
              <Button onClick={() => go(Math.min(scenario.steps.length - 1, step + 1))}>
                Next step <ArrowRight className="size-4" />
              </Button>
              <Button variant="ghost" onClick={() => set((s) => ({ ...s, demoStep: 0 }))}>
                Restart scenario
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Talking points</CardTitle>
              <CardDescription>Say these while clicking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                "One health identity carries the record between every facility.",
                "Emergencies get seconds-fast access without breaking privacy.",
                "Consent is explicit, scoped, time-bound and revocable.",
                "Every access is hash-chained and impossible to alter silently.",
                "The whole workflow survives losing the network.",
              ].map((t) => (
                <div key={t} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {t}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick state controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  set((s) => ({ ...s, online: !s.online }));
                  toast(`Network is now ${state.online ? "offline" : "online"}`);
                }}
              >
                Toggle network ({state.online ? "online" : "offline"})
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  set((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
                  toast("Notifications cleared");
                }}
              >
                Clear notifications
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  reset();
                  navigate({ to: "/" });
                }}
              >
                Reset and return home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
