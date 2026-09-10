import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Download, Phone, Printer, ShieldAlert } from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { FakeQR } from "@/components/FakeQR";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/patient/emergency-profile")({
  head: () => ({
    meta: [
      { title: "Emergency Health Card — SWASTHYASETU" },
      {
        name: "description",
        content:
          "A printable, QR-linked emergency health card carrying blood group, allergies, conditions and next of kin.",
      },
      { property: "og:title", content: "Emergency Health Card — SWASTHYASETU" },
      {
        property: "og:description",
        content: "Printable QR emergency card with blood group, allergies and next of kin.",
      },
    ],
  }),
  component: EmergencyProfile,
});

function EmergencyProfile() {
  const { state, set, logAudit } = useStore();
  const { patient } = state;
  const latest = state.vitals[state.vitals.length - 1];
  const [shareVitals, setShareVitals] = useState(true);
  const [shareMeds, setShareMeds] = useState(true);
  const [shareContact, setShareContact] = useState(true);

  return (
    <AppShell
      title="Emergency health card"
      description="What a stranger, a paramedic or a casualty officer must know about you within seconds — and nothing more."
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => {
              logAudit({
                actor: "Rahul Sharma (self)",
                action: "Emergency card downloaded",
                scope: "Emergency card",
              });
              toast.success("Emergency card saved to your device");
            }}
          >
            <Download className="size-4" /> Download
          </Button>
          <Button
            onClick={() => {
              toast.success("Opening print dialog");
              if (typeof window !== "undefined") setTimeout(() => window.print(), 300);
            }}
          >
            <Printer className="size-4" /> Print card
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="border-destructive/30 lg:col-span-2">
          <CardHeader className="border-b border-border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <ShieldAlert className="size-5" /> CRITICAL MEDICAL INFORMATION
                </CardTitle>
                <CardDescription>SWASTHYASETU ID {patient.id} · ABHA {patient.abha}</CardDescription>
              </div>
              <StatBadge tone="bad">Emergency access enabled</StatBadge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">{patient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {patient.age} yrs · {patient.gender} · Speaks {patient.language}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                      Blood group
                    </p>
                    <p className="text-3xl font-bold text-destructive">{patient.bloodGroup}</p>
                  </div>
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                      Allergies — do not administer
                    </p>
                    <p className="text-xl font-bold text-destructive">{patient.allergies.join(", ")}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Chronic conditions
                  </p>
                  <p className="mt-1 text-sm font-medium">{patient.conditions.join(" · ")}</p>
                </div>
                {shareMeds && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Current medication
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {patient.medications.map((m) => `${m.name} ${m.dose}`).join(" · ")}
                    </p>
                  </div>
                )}
                {shareContact && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Emergency contact
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {patient.emergencyContact.name} ({patient.emergencyContact.relation}) ·{" "}
                      {patient.emergencyContact.phone}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-3">
                <FakeQR seed={patient.id + patient.abha} />
                <p className="max-w-40 text-center text-xs text-muted-foreground">
                  Scan to open the emergency record. Every scan is logged.
                </p>
                <StatBadge tone="info">Offline-readable</StatBadge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vital alerts</CardTitle>
              <CardDescription>Auto-generated from recent readings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {latest.systolic > 130 && (
                <div className="flex gap-2 rounded-md border border-warning/40 bg-warning/15 p-3">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Elevated BP {latest.systolic}/{latest.diastolic} mmHg — monitor during any procedure.</span>
                </div>
              )}
              {latest.glucose > 125 && (
                <div className="flex gap-2 rounded-md border border-warning/40 bg-warning/15 p-3">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Diabetic — glucose {latest.glucose} mg/dL. Risk of hypoglycaemia if fasting.</span>
                </div>
              )}
              <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Penicillin allergy — use Cefixime or macrolide alternatives.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="no-print">
            <CardHeader>
              <CardTitle className="text-base">What the card reveals</CardTitle>
              <CardDescription>Blood group, allergies and conditions are always included</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Current medication", shareMeds, setShareMeds] as const,
                ["Emergency contact", shareContact, setShareContact] as const,
                ["Recent vitals", shareVitals, setShareVitals] as const,
              ].map(([label, value, setter]) => (
                <div key={label} className="flex items-center justify-between">
                  <Label htmlFor={label}>{label}</Label>
                  <Switch
                    id={label}
                    checked={value}
                    onCheckedChange={(v) => {
                      setter(v);
                      toast(`${label} ${v ? "included in" : "removed from"} emergency card`);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="no-print">
            <CardHeader>
              <CardTitle className="text-base">Next of kin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">
                {patient.emergencyContact.name} · {patient.emergencyContact.relation}
              </p>
              <p className="text-sm text-muted-foreground">{patient.emergencyContact.phone}</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  set((s) => ({
                    ...s,
                    notifications: [
                      {
                        id: `N-${Date.now()}`,
                        title: "Test alert sent",
                        body: `SMS drill delivered to ${patient.emergencyContact.name}.`,
                        time: "just now",
                        read: false,
                      },
                      ...s.notifications,
                    ],
                  }));
                  toast.success("Test alert sent to Priya Sharma");
                }}
              >
                <Phone className="size-4" /> Send test alert
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
