import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ShieldCheck, ShieldX, Clock, Building2 } from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore, type ConsentRequest } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/consent")({
  head: () => ({
    meta: [
      { title: "Consent Manager — SWASTHYASETU" },
      {
        name: "description",
        content:
          "ABDM-style consent manager: approve, scope-limit, time-bound and revoke every request for your health data.",
      },
      { property: "og:title", content: "Consent Manager — SWASTHYASETU" },
      {
        property: "og:description",
        content: "Approve, scope-limit and revoke every request for your health data.",
      },
    ],
  }),
  component: ConsentManager,
});

const allScopes = ["Vitals", "Diagnostics", "Prescriptions", "Discharge Summary", "Immunisation"];

function ConsentManager() {
  const { state, set, logAudit } = useStore();
  const [revoking, setRevoking] = useState<ConsentRequest | null>(null);
  const [granular, setGranular] = useState<Record<string, boolean>>({
    Vitals: true,
    Diagnostics: true,
    Prescriptions: true,
    "Discharge Summary": false,
    Immunisation: true,
  });

  const pending = state.consents.filter((c) => c.status === "pending");
  const active = state.consents.filter((c) => c.status === "active");
  const closed = state.consents.filter((c) => c.status === "revoked" || c.status === "denied");

  const decide = (c: ConsentRequest, status: ConsentRequest["status"]) => {
    set((s) => ({
      ...s,
      consents: s.consents.map((x) => (x.id === c.id ? { ...x, status } : x)),
    }));
    logAudit({
      actor: "Rahul Sharma (self)",
      action: `Consent ${status} — ${c.requester}`,
      scope: c.scopes.join(", "),
    });
    setRevoking(null);
    toast.success(`Consent ${status} for ${c.requester}`);
  };

  const ConsentCard = ({ c }: { c: ConsentRequest }) => (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <div>
              <CardTitle className="text-sm">{c.requester}</CardTitle>
              <CardDescription>{c.purpose}</CardDescription>
            </div>
          </div>
          <StatBadge
            tone={
              c.status === "active" ? "good" : c.status === "pending" ? "warn" : c.status === "denied" ? "neutral" : "bad"
            }
          >
            {c.status}
          </StatBadge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {c.scopes.map((s) => (
            <StatBadge key={s} tone="info">
              {s}
            </StatBadge>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> Requested {c.requestedOn}
          </span>
          <span>Valid for {c.expiry}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.status === "pending" && (
            <>
              <Button size="sm" onClick={() => decide(c, "active")}>
                <Check className="size-4" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide(c, "denied")}>
                Deny
              </Button>
            </>
          )}
          {c.status === "active" && (
            <>
              <Button size="sm" variant="destructive" onClick={() => setRevoking(c)}>
                <ShieldX className="size-4" /> Revoke access
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.success(`Access history shown for ${c.requester}`)}
              >
                View access history
              </Button>
            </>
          )}
          {(c.status === "revoked" || c.status === "denied") && (
            <Button size="sm" variant="outline" onClick={() => decide(c, "active")}>
              Re-grant access
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppShell
      title="Consent manager"
      description="Nothing leaves your record without an explicit, scoped and time-bound consent artefact — modelled on the ABDM consent framework."
      actions={
        <Button
          variant="outline"
          onClick={() => {
            active.forEach((c) =>
              logAudit({
                actor: "Rahul Sharma (self)",
                action: `Consent revoked — ${c.requester}`,
                scope: c.scopes.join(", "),
              }),
            );
            set((s) => ({
              ...s,
              consents: s.consents.map((c) => (c.status === "active" ? { ...c, status: "revoked" } : c)),
            }));
            toast.success("All active consents revoked");
          }}
        >
          <ShieldX className="size-4" /> Revoke all
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Pending requests", pending.length],
          ["Active consents", active.length],
          ["Revoked / denied", closed.length],
        ].map(([l, v]) => (
          <Card key={String(l)}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{l}</p>
              <p className="mt-1 text-2xl font-bold">{v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
              <TabsTrigger value="closed">Revoked ({closed.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4 space-y-4">
              {pending.map((c) => (
                <ConsentCard key={c.id} c={c} />
              ))}
              {pending.length === 0 && (
                <p className="text-sm text-muted-foreground">No pending requests.</p>
              )}
            </TabsContent>
            <TabsContent value="active" className="mt-4 space-y-4">
              {active.map((c) => (
                <ConsentCard key={c.id} c={c} />
              ))}
              {active.length === 0 && <p className="text-sm text-muted-foreground">No active consents.</p>}
            </TabsContent>
            <TabsContent value="closed" className="mt-4 space-y-4">
              {closed.map((c) => (
                <ConsentCard key={c.id} c={c} />
              ))}
              {closed.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing revoked or denied yet.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4" /> Default sharing controls
              </CardTitle>
              <CardDescription>Applied to every new consent request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {allScopes.map((s) => (
                <div key={s} className="flex items-center justify-between">
                  <Label htmlFor={`sc-${s}`}>{s}</Label>
                  <Switch
                    id={`sc-${s}`}
                    checked={granular[s] ?? false}
                    onCheckedChange={(v) => {
                      setGranular({ ...granular, [s]: v });
                      logAudit({
                        actor: "Rahul Sharma (self)",
                        action: `Default sharing ${v ? "enabled" : "disabled"}`,
                        scope: s,
                      });
                      toast(`${s} sharing ${v ? "enabled" : "disabled"} by default`);
                    }}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Emergency responders can still see blood group, allergies and conditions through break-glass
                access, which is always logged.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Simulate an incoming request</CardTitle>
              <CardDescription>Useful during the judge walkthrough</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => {
                  const id = `CON-${Date.now()}`;
                  set((s) => ({
                    ...s,
                    consents: [
                      {
                        id,
                        requester: "Government PHC, Chikkaballapur",
                        purpose: "Referral care during rural camp",
                        scopes: ["Vitals", "Prescriptions"],
                        requestedOn: new Date().toISOString().slice(0, 10),
                        expiry: "7 days",
                        status: "pending",
                      },
                      ...s.consents,
                    ],
                    notifications: [
                      {
                        id: `N-${Date.now()}`,
                        title: "New consent request",
                        body: "Government PHC, Chikkaballapur requests vitals and prescriptions.",
                        time: "just now",
                        read: false,
                      },
                      ...s.notifications,
                    ],
                  }));
                  toast.success("Incoming consent request received");
                }}
              >
                Trigger consent request
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!revoking} onOpenChange={(o) => !o && setRevoking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke access?</DialogTitle>
            <DialogDescription>
              {revoking?.requester} will immediately lose access to {revoking?.scopes.join(", ")}. Data
              already downloaded under this consent must be deleted by the requester under ABDM rules.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevoking(null)}>
              Keep access
            </Button>
            <Button variant="destructive" onClick={() => revoking && decide(revoking, "revoked")}>
              Revoke now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
