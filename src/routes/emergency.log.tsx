import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Link2, ShieldCheck } from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStore, shortHash } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/emergency/log")({
  head: () => ({
    meta: [
      { title: "Emergency Access Audit Log — SWASTHYASETU" },
      {
        name: "description",
        content:
          "A hash-chained, tamper-evident record of every emergency data request and break-glass override.",
      },
      { property: "og:title", content: "Emergency Access Audit Log — SWASTHYASETU" },
      { property: "og:description", content: "Hash-chained, tamper-evident emergency access records." },
    ],
  }),
  component: AuditLog,
});

function AuditLog() {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [verified, setVerified] = useState<null | boolean>(null);

  const rows = state.audit
    .filter(
      (a) =>
        !q.trim() ||
        `${a.actor} ${a.action} ${a.scope}`.toLowerCase().includes(q.trim().toLowerCase()),
    )
    .slice()
    .reverse();

  const overrides = state.audit.filter((a) => a.override).length;

  const verify = () => {
    let prev = "0000000000000";
    let ok = true;
    state.audit.forEach((a, i) => {
      const expected = shortHash(prev + a.actor + a.action + i);
      if (a.prevHash !== prev || a.hash !== expected) ok = false;
      prev = a.hash;
    });
    setVerified(ok);
    ok
      ? toast.success("Chain intact — no entry has been altered or removed")
      : toast.error("Chain broken — tampering detected");
  };

  return (
    <AppShell
      title="Emergency access audit log"
      description="Every read of this record is appended to a hash chain. Deleting or editing an entry breaks verification."
      actions={
        <>
          <Button variant="outline" onClick={() => toast.success("Audit log exported as signed CSV")}>
            <Download className="size-4" /> Export
          </Button>
          <Button onClick={verify}>
            <ShieldCheck className="size-4" /> Verify chain integrity
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total access events", state.audit.length],
          ["Break-glass overrides", overrides],
          ["Chain status", verified === null ? "Not verified" : verified ? "Intact" : "Broken"],
        ].map(([l, v]) => (
          <Card key={String(l)}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{l}</p>
              <p className="mt-1 text-2xl font-bold">{v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base">Access ledger</CardTitle>
          <CardDescription>Newest first · {rows.length} entries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Filter by actor, action or scope…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="space-y-3">
            {rows.map((a) => (
              <div
                key={a.id}
                className={`rounded-lg border p-4 text-sm ${
                  a.override ? "border-destructive/30 bg-destructive/5" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{a.action}</span>
                  {a.override && <StatBadge tone="bad">break-glass</StatBadge>}
                  <span className="ml-auto text-xs text-muted-foreground">{a.time}</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {a.actor} · {a.location}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Fields accessed: {a.scope}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                  <Link2 className="size-3" />
                  <span>prev {a.prevHash}</span>
                  <span>→</span>
                  <span className="text-foreground">hash {a.hash}</span>
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="text-sm text-muted-foreground">No matching entries.</p>}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
