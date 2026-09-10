import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Boxes,
  Cloud,
  Database,
  Fingerprint,
  Hospital,
  Lock,
  Radio,
  Smartphone,
  Workflow,
} from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture Blueprint — SWASTHYASETU" },
      {
        name: "description",
        content:
          "Interactive architecture and data-flow blueprint of SWASTHYASETU: ABDM-aligned consent, offline-first clients and tamper-evident audit.",
      },
      { property: "og:title", content: "Architecture Blueprint — SWASTHYASETU" },
      {
        property: "og:description",
        content: "ABDM-aligned consent, offline-first clients and a tamper-evident audit ledger.",
      },
    ],
  }),
  component: ArchitecturePage,
});

const layers = [
  {
    id: "clients",
    name: "Client layer",
    icon: Smartphone,
    tone: "info" as const,
    blurb: "Patient app, doctor workspace, emergency responder console and kiosk mode.",
    details: [
      "React + TanStack Start, server-rendered for low-end Android browsers",
      "Encrypted local cache so every screen works with no network",
      "Durable write queue replays to the exchange on reconnect",
      "Language packs: Kannada, Hindi, English (patient record carries preferred language)",
    ],
  },
  {
    id: "identity",
    name: "Identity & consent",
    icon: Fingerprint,
    tone: "good" as const,
    blurb: "ABHA-linked identity with ABDM consent artefacts as the only door to data.",
    details: [
      "ABHA number / address resolves the patient across facilities",
      "Every fetch carries a signed, scoped, time-bound consent artefact",
      "Granular scopes: vitals, diagnostics, prescriptions, discharge, immunisation",
      "Break-glass path for emergencies — permitted, but always logged and notified",
    ],
  },
  {
    id: "services",
    name: "Service layer",
    icon: Workflow,
    tone: "neutral" as const,
    blurb: "Stateless health-record services behind an API gateway.",
    details: [
      "Record service (longitudinal timeline), document service, prescription service",
      "Emergency lookup service with a minimised critical-data projection",
      "Notification service for consent requests and break-glass alerts",
      "Idempotent writes keyed by client-generated IDs, so replays never duplicate",
    ],
  },
  {
    id: "data",
    name: "Data & storage",
    icon: Database,
    tone: "info" as const,
    blurb: "FHIR-shaped clinical store, object storage for files, append-only audit ledger.",
    details: [
      "FHIR R4 resources: Patient, Observation, Condition, AllergyIntolerance, MedicationRequest",
      "Object storage for lab PDFs and radiology, referenced not embedded",
      "Hash-chained audit ledger — each entry seals the previous hash",
      "Row-level access rules derived from the active consent artefact",
    ],
  },
  {
    id: "network",
    name: "Health network",
    icon: Hospital,
    tone: "warn" as const,
    blurb: "Federation with hospitals, labs, PHCs and the national exchange.",
    details: [
      "Health Information Providers publish; Health Information Users request",
      "SWASTHYASETU acts as both HIU and patient-side Health Locker",
      "Registry sync for facility and practitioner identity",
      "Rural PHC nodes operate offline-first and reconcile nightly",
    ],
  },
];

const flows: Record<string, { title: string; steps: string[] }> = {
  emergency: {
    title: "Roadside emergency lookup (break-glass)",
    steps: [
      "Responder scans the patient's emergency QR or types the health ID",
      "Emergency service validates responder credentials and the break-glass reason",
      "Minimised projection returns only blood group, allergies, conditions, medications, contact",
      "Audit ledger appends a hash-chained break-glass entry",
      "Patient and emergency contact are notified within seconds",
      "Handover packet is pushed to the receiving hospital's queue",
    ],
  },
  consult: {
    title: "OPD consultation with consent",
    steps: [
      "Doctor searches by ABHA address or patient ID in the OPD queue",
      "Consent request is raised with purpose and scopes; patient approves on their phone",
      "Longitudinal record streams in — vitals, diagnoses, allergies, prior prescriptions",
      "Prescription writer blocks any drug clashing with a recorded allergy",
      "Signed prescription and notes are written back as FHIR resources",
      "Consent expires automatically; every read stays in the audit ledger",
    ],
  },
  offline: {
    title: "Offline PHC visit and reconciliation",
    steps: [
      "Device loses connectivity; UI switches to cached record",
      "Vitals, prescriptions and photographed documents are written to the local queue",
      "Each write carries a client-generated ID and a timestamp",
      "On reconnect the queue replays against the idempotent write API",
      "Server resolves ordering by timestamp; conflicting edits are kept as versions",
      "Patient sees the merged timeline; queue clears to zero",
    ],
  },
};

function ArchitecturePage() {
  const [active, setActive] = useState("clients");
  const current = layers.find((l) => l.id === active) ?? layers[0]!;

  return (
    <AppShell
      title="Architecture blueprint"
      description="How SWASTHYASETU moves a health record safely between a patient, a doctor and a first responder — offline included."
      actions={
        <Button variant="outline" onClick={() => window.print()}>
          Print for judges
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Boxes className="size-4" /> System layers
          </CardTitle>
          <CardDescription>Select a layer to expand its responsibilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-5">
            {layers.map((l) => {
              const Icon = l.icon;
              const on = l.id === active;
              return (
                <button
                  key={l.id}
                  onClick={() => setActive(l.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    on
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-secondary/60"
                  }`}
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">{l.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{l.blurb}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatBadge tone={current.tone}>{current.name}</StatBadge>
              <p className="text-sm text-muted-foreground">{current.blurb}</p>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {current.details.map((d) => (
                <li key={d} className="flex gap-2 text-sm">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="size-4" /> Data flows
            </CardTitle>
            <CardDescription>The three journeys demonstrated in the live prototype</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="emergency">
              <TabsList>
                <TabsTrigger value="emergency">Emergency</TabsTrigger>
                <TabsTrigger value="consult">Consultation</TabsTrigger>
                <TabsTrigger value="offline">Offline sync</TabsTrigger>
              </TabsList>
              {Object.entries(flows).map(([k, f]) => (
                <TabsContent key={k} value={k} className="mt-4">
                  <p className="text-sm font-semibold">{f.title}</p>
                  <ol className="mt-4 space-y-3">
                    {f.steps.map((s, i) => (
                      <li key={s} className="flex gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {i + 1}
                        </span>
                        <p className="pt-1 text-sm">{s}</p>
                      </li>
                    ))}
                  </ol>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="size-4" /> Security posture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                "Consent-artefact gating on every read",
                "Data minimisation for emergency projections",
                "Hash-chained, append-only audit ledger",
                "Encryption at rest on device and server",
                "Break-glass access notifies the patient instantly",
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
              <CardTitle className="flex items-center gap-2 text-base">
                <Cloud className="size-4" /> Scale targets
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Emergency lookup", "< 3 s"],
                ["Offline cache", "100% core record"],
                ["Consent decision", "< 30 s"],
                ["Audit retention", "7 years"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="font-semibold">{v}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
