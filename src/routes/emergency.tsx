import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets, MessageSquare, Phone, QrCode, ScanLine, ShieldAlert, Siren } from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency Triage Portal — SWASTHYASETU" },
      {
        name: "description",
        content:
          "One-tap critical medical lookup for responders: blood group, allergies, conditions and next of kin in seconds.",
      },
      { property: "og:title", content: "Emergency Triage Portal — SWASTHYASETU" },
      { property: "og:description", content: "One-tap critical lookup for emergency responders." },
    ],
  }),
  component: EmergencyPortal,
});

function EmergencyPortal() {
  const { state, logAudit } = useStore();
  const { patient } = state;
  const latest = lastVital(state);
  const [id, setId] = useState("SS-10024");
  const [unlocked, setUnlocked] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bloodConfirmed, setBloodConfirmed] = useState(false);

  const lookup = (override: boolean) => {
    if (id.trim().toUpperCase() !== patient.id && id.trim() !== patient.abha) {
      toast.error("No record matches that ID. Try SS-10024.");
      return;
    }
    setUnlocked(true);
    setConfirmOpen(false);
    logAudit({
      actor: "Paramedic Unit 108-DL42",
      action: override ? "Break-glass override access" : "Emergency profile accessed",
      scope: "Blood group, Allergies, Conditions, Medication, Next of kin",
      location: "MG Road, Bengaluru, KA",
      override,
    });
    toast.success(override ? "Break-glass access granted — logged" : "Critical record retrieved in 2.1s");
  };

  return (
    <AppShell
      title="Emergency triage portal"
      description="Ambulance Unit 108-DL42 · Responder access is read-only, minimal-field and permanently logged."
      actions={
        <Button variant="outline" asChild>
          <Link to="/emergency/log">View access log</Link>
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanLine className="size-4" /> Identify the patient
            </CardTitle>
            <CardDescription>Scan the QR band or type the SWASTHYASETU / ABHA ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="SS-10024" />
            <Button className="w-full" size="lg" onClick={() => lookup(false)}>
              <Siren className="size-4" /> Retrieve critical record
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setId(patient.id); toast("QR band scanned"); }}>
              <QrCode className="size-4" /> Simulate QR scan
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setConfirmOpen(true)}
            >
              <ShieldAlert className="size-4" /> Break-glass override
            </Button>
            <p className="text-xs text-muted-foreground">
              Override is used only when the patient is unconscious and unable to consent. The patient and the
              hospital compliance officer are notified immediately.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          {!unlocked ? (
            <Card className="flex h-full items-center justify-center py-16">
              <div className="text-center">
                <Siren className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No record loaded. Scan or enter a patient ID to begin triage.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <Card className="border-destructive/40">
                <CardHeader className="border-b border-border">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{patient.name}</CardTitle>
                      <CardDescription>
                        {patient.age} yrs · {patient.gender} · Speaks {patient.language} · {patient.id}
                      </CardDescription>
                    </div>
                    <StatBadge tone="bad">Read-only emergency view</StatBadge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                      Blood group
                    </p>
                    <p className="text-4xl font-bold text-destructive">{patient.bloodGroup}</p>
                    <Button
                      size="sm"
                      variant={bloodConfirmed ? "secondary" : "outline"}
                      className="mt-3"
                      onClick={() => {
                        setBloodConfirmed(true);
                        logAudit({
                          actor: "Paramedic Unit 108-DL42",
                          action: "Blood group verified against record",
                          scope: "Blood group",
                          location: "MG Road, Bengaluru, KA",
                        });
                        toast.success("Blood group verified against national registry");
                      }}
                    >
                      <Droplets className="size-4" />
                      {bloodConfirmed ? "Verified" : "Verify blood group"}
                    </Button>
                  </div>
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                      Allergies — do not administer
                    </p>
                    <p className="text-2xl font-bold text-destructive">{patient.allergies.join(", ")}</p>
                    <p className="mt-2 text-xs text-destructive">
                      Avoid all beta-lactams. Use Cefixime or a macrolide.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Chronic conditions
                    </p>
                    <p className="mt-1 font-medium">{patient.conditions.join(" · ")}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last glucose {latest.glucose} mg/dL · Last BP {latest.systolic}/{latest.diastolic} mmHg
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Current medication
                    </p>
                    <p className="mt-1 font-medium">
                      {patient.medications.map((m) => `${m.name} ${m.dose}`).join(" · ")}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Surgery: {patient.surgeries.map((s) => `${s.name} ${s.year}`).join(", ")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Next of kin</CardTitle>
                  <CardDescription>
                    {patient.emergencyContact.name} · {patient.emergencyContact.relation} ·{" "}
                    {patient.emergencyContact.phone}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      logAudit({
                        actor: "Paramedic Unit 108-DL42",
                        action: "Emergency contact called",
                        scope: "Next of kin",
                        location: "MG Road, Bengaluru, KA",
                      });
                      toast.success(`Dialling ${patient.emergencyContact.name}…`);
                    }}
                  >
                    <Phone className="size-4" /> Call {patient.emergencyContact.name.split(" ")[0]}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      logAudit({
                        actor: "Paramedic Unit 108-DL42",
                        action: "Emergency SMS sent to next of kin",
                        scope: "Next of kin",
                        location: "MG Road, Bengaluru, KA",
                      });
                      toast.success("SMS sent: patient being transported to Manipal Hospital ER");
                    }}
                  >
                    <MessageSquare className="size-4" /> Send SMS alert
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      logAudit({
                        actor: "Paramedic Unit 108-DL42",
                        action: "Pre-arrival handover sent to hospital ER",
                        scope: "Emergency summary",
                        location: "MG Road, Bengaluru, KA",
                      });
                      toast.success("Handover pushed to Manipal Hospital ER dashboard");
                    }}
                  >
                    Notify receiving hospital
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm break-glass override</DialogTitle>
            <DialogDescription>
              You are about to access a patient record without consent. This is permitted only for a
              life-threatening emergency. The action is written to a tamper-evident log and reported to the
              patient.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => lookup(true)}>
              I accept responsibility — override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
