import { createFileRoute } from "@tanstack/react-router";
import { CloudOff, Cloud, Database, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useStore, nowStamp } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/offline")({
  head: () => ({
    meta: [
      { title: "Offline & Sync Simulator — SWASTHYASETU" },
      {
        name: "description",
        content:
          "Simulate patchy rural connectivity: cached records, a durable write queue and conflict-free sync on reconnect.",
      },
      { property: "og:title", content: "Offline & Sync Simulator — SWASTHYASETU" },
      { property: "og:description", content: "Cached records and a durable sync queue for rural connectivity." },
    ],
  }),
  component: OfflinePage,
});

const cacheItems = [
  { label: "Patient demographics", size: "4 KB", pct: 100 },
  { label: "Emergency card", size: "12 KB", pct: 100 },
  { label: "Vitals (last 12 months)", size: "38 KB", pct: 100 },
  { label: "Prescriptions", size: "22 KB", pct: 100 },
  { label: "Radiology images", size: "2.1 MB", pct: 46 },
];

function OfflinePage() {
  const { state, set, logAudit } = useStore();
  const queued = state.syncQueue.filter((q) => q.status === "queued");

  const toggleNetwork = (online: boolean) => {
    set((s) => ({ ...s, online }));
    logAudit({
      actor: "System",
      action: online ? "Device reconnected" : "Device went offline",
      scope: "Connectivity",
    });
    toast(online ? "Back online — ready to sync" : "Offline mode — writes will be queued locally");
  };

  const addWork = (label: string, kind: string) => {
    set((s) => ({
      ...s,
      syncQueue: [
        ...s.syncQueue,
        { id: `SYNC-${Date.now()}-${Math.random()}`, label, kind, createdAt: nowStamp(), status: "queued" },
      ],
    }));
    toast.success(`${label} saved locally`);
  };

  const syncAll = () => {
    if (!state.online) {
      toast.error("Cannot sync while offline — switch the network on first");
      return;
    }
    if (queued.length === 0) {
      toast("Nothing to sync");
      return;
    }
    set((s) => ({
      ...s,
      syncQueue: s.syncQueue.map((q) => ({ ...q, status: "synced" as const })),
    }));
    logAudit({ actor: "System", action: `Synced ${queued.length} queued record(s)`, scope: "Sync queue" });
    toast.success(`${queued.length} record(s) synced to the national health exchange`);
  };

  return (
    <AppShell
      title="Offline & sync"
      description="Half of India's PHCs work on intermittent connectivity. SWASTHYASETU keeps functioning and reconciles when the link returns."
      actions={
        <Button onClick={syncAll} disabled={!state.online || queued.length === 0}>
          <RefreshCw className="size-4" /> Sync now
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {state.online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />} Network simulator
            </CardTitle>
            <CardDescription>Toggle connectivity to see the app adapt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="net" className="text-base">
                  {state.online ? "Online" : "Offline"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {state.online ? "Connected to ABDM gateway" : "Serving from local encrypted cache"}
                </p>
              </div>
              <Switch id="net" checked={state.online} onCheckedChange={toggleNetwork} />
            </div>
            <StatBadge tone={state.online ? "good" : "warn"}>
              {state.online ? "Gateway reachable · 84 ms" : "No route to gateway"}
            </StatBadge>
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">Generate offline work</p>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addWork("Vitals recorded at PHC", "vitals")}
              >
                Record vitals offline
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addWork("Prescription drafted offline", "prescription")}
              >
                Write prescription offline
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addWork("Lab report photographed", "document")}
              >
                Capture document offline
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Sync queue</CardTitle>
                <CardDescription>
                  {queued.length} pending · {state.syncQueue.length - queued.length} synced
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={syncAll} disabled={!state.online}>
                  <RefreshCw className="size-4" /> Retry all
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    set((s) => ({ ...s, syncQueue: s.syncQueue.filter((q) => q.status === "queued") }));
                    toast("Cleared synced entries");
                  }}
                >
                  <Trash2 className="size-4" /> Clear synced
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.syncQueue.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Queue is empty. Go offline and record something to see durable writes in action.
              </div>
            )}
            {state.syncQueue
              .slice()
              .reverse()
              .map((q) => (
                <div
                  key={q.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 text-sm"
                >
                  <span className="flex size-9 items-center justify-center rounded-md bg-secondary">
                    {q.status === "queued" ? <CloudOff className="size-4" /> : <Cloud className="size-4" />}
                  </span>
                  <div>
                    <p className="font-medium">{q.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.kind} · queued {q.createdAt}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <StatBadge tone={q.status === "queued" ? "warn" : "good"}>{q.status}</StatBadge>
                    {q.status === "queued" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!state.online}
                        onClick={() => {
                          set((s) => ({
                            ...s,
                            syncQueue: s.syncQueue.map((x) =>
                              x.id === q.id ? { ...x, status: "synced" as const } : x,
                            ),
                          }));
                          toast.success(`${q.label} synced`);
                        }}
                      >
                        Sync
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        set((s) => ({ ...s, syncQueue: s.syncQueue.filter((x) => x.id !== q.id) }));
                        toast("Entry discarded");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4" /> Local cache status
          </CardTitle>
          <CardDescription>
            Encrypted on-device store · 2.2 MB used · last refreshed {state.vitals[state.vitals.length - 1]?.date}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cacheItems.map((c) => (
            <div key={c.label} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.label}</span>
                <span className="text-xs text-muted-foreground">{c.size}</span>
              </div>
              <Progress value={c.pct} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                {c.pct === 100 ? "Fully cached — available offline" : `${c.pct}% cached — partial offline access`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
