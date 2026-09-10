import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ActivitySquare,
  ArrowRight,
  CloudOff,
  HeartPulse,
  Languages,
  Network,
  Presentation,
  ShieldCheck,
  Siren,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrototypeNotice } from "@/components/AppShell";
import { useStore, type Role } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SWASTHYASETU — AI-Assisted Multilingual Patient Health Platform" },
      {
        name: "description",
        content:
          "Enter SWASTHYASETU as a patient, clinician, emergency responder or hackathon judge. AI-assisted, multilingual, consent-driven health records. Simulated prototype.",
      },
      { property: "og:title", content: "SWASTHYASETU — AI-Assisted Multilingual Patient Health Platform" },
      {
        property: "og:description",
        content:
          "AI-assisted multilingual patient health platform — SIH prototype with simulated data.",
      },
    ],
  }),
  component: Landing,
});

const roles: {
  role: Role;
  title: string;
  person: string;
  to: string;
  icon: typeof UserRound;
  points: string[];
}[] = [
  {
    role: "patient",
    title: "Patient",
    person: "Rahul Sharma · ABHA 12-3456-7890-1024",
    to: "/patient",
    icon: UserRound,
    points: ["Longitudinal health record", "Consent control over every share", "Printable emergency card"],
  },
  {
    role: "doctor",
    title: "Doctor / Clinician",
    person: "Dr. Ananya Rao · Endocrinology, Manipal",
    to: "/doctor",
    icon: Stethoscope,
    points: ["OPD queue & ABHA search", "Longitudinal vitals charts", "Digital prescriptions & lab orders"],
  },
  {
    role: "responder",
    title: "Emergency Responder",
    person: "Ambulance Unit 108-DL42",
    to: "/emergency",
    icon: Siren,
    points: ["One-tap critical lookup", "Allergy & blood group alerts", "Tamper-evident access log"],
  },
  {
    role: "judge",
    title: "Judge / Demo Guide",
    person: "SIH evaluation walkthrough",
    to: "/scenarios",
    icon: Presentation,
    points: ["5-minute guided script", "Architecture blueprint", "Offline resilience demo"],
  },
];

const pillars = [
  {
    icon: ShieldCheck,
    title: "ABDM-style consent",
    body: "Every data request is explicit, time-bound, scope-limited and revocable by the patient.",
  },
  {
    icon: Siren,
    title: "Break-glass emergency access",
    body: "Life-saving facts in under three seconds, with every override written to an audit chain.",
  },
  {
    icon: CloudOff,
    title: "Offline-first for rural India",
    body: "Cached records and a sync queue keep PHCs working through unreliable connectivity.",
  },
  {
    icon: Languages,
    title: "Multilingual by design",
    body: "Records are structured, so the same data renders in the patient's preferred language.",
  },
];

function Landing() {
  const { set } = useStore();
  const navigate = useNavigate();

  const enter = (role: Role, to: string) => {
    set((s) => ({ ...s, role }));
    toast.success(`Entering as ${role === "responder" ? "emergency responder" : role}`);
    navigate({ to });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HeartPulse className="size-5" />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold tracking-tight">
                SWASTHYASETU
                <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-semibold uppercase">
                  SIH Prototype
                </Badge>
              </p>
              <p className="text-[10px] text-muted-foreground">
                AI-Assisted Multilingual Patient Health Platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/architecture">Architecture</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/scenarios">Judge demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-border bg-gradient-to-b from-primary/8 to-background">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary">
            SIH Prototype · AI-Assisted Multilingual Patient Health Platform
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            One health record. Every doctor, every hospital, every emergency.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            SWASTHYASETU bridges fragmented Indian health records into a single consent-governed timeline —
            usable in a city super-speciality OPD, a rural PHC without internet, and at the roadside in the
            first golden hour.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => enter("patient", "/patient")}>
              Start as patient <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => enter("responder", "/emergency")}>
              <Siren className="size-4" /> Emergency lookup
            </Button>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["3 sec", "Emergency lookup"],
              ["100%", "Consent-logged access"],
              ["0", "Data loss offline"],
              ["14", "Working screens"],
            ].map(([a, b]) => (
              <div key={b} className="rounded-lg border border-border bg-card px-3 py-4">
                <p className="text-2xl font-bold text-primary">{a}</p>
                <p className="text-xs text-muted-foreground">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 pt-8">
        <PrototypeNotice className="mb-0" />
      </div>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-xl font-semibold tracking-tight">Choose how you want to enter the demo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All four roles operate on the same shared record for Rahul Sharma, so changes in one view appear
          instantly in the others.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {roles.map((r) => (
            <Card key={r.role} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <r.icon className="size-5" />
                  </span>
                  <div>
                    <CardTitle className="text-lg">{r.title}</CardTitle>
                    <CardDescription>{r.person}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <ActivitySquare className="mt-0.5 size-3.5 shrink-0 text-accent" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => enter(r.role, r.to)}>
                  Enter {r.title} view <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-xl font-semibold tracking-tight">What makes it different</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-lg border border-border bg-background p-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
                  <p.icon className="size-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link to="/architecture">
                <Network className="size-4" /> View architecture blueprint
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/offline">
                <CloudOff className="size-4" /> Try offline simulator
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/consent">
                <ShieldCheck className="size-4" /> Open consent manager
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        SWASTHYASETU · Simulated Prototype — No real Aadhaar, ABHA, or government APIs connected.
        Identity, biometrics, SMS, and OCR features are simulated for demonstration.
      </footer>
    </div>
  );
}
