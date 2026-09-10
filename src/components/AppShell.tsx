import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpenCheck,
  CloudOff,
  FileText,
  HeartPulse,
  History,
  LayoutGrid,
  Menu,
  Network,
  Presentation,
  QrCode,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Siren,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useStore, type Role } from "@/lib/store";
import { toast } from "sonner";

type NavItem = { to: string; label: string; icon: typeof Activity };

const groups: { title: string; role: Role; items: NavItem[] }[] = [
  {
    title: "Patient",
    role: "patient",
    items: [
      { to: "/patient", label: "Health Dashboard", icon: HeartPulse },
      { to: "/patient/history", label: "Medical History", icon: History },
      { to: "/patient/documents", label: "Health Locker", icon: FileText },
      { to: "/patient/emergency-profile", label: "Emergency Card", icon: QrCode },
    ],
  },
  {
    title: "Clinician",
    role: "doctor",
    items: [
      { to: "/doctor", label: "OPD Workspace", icon: Stethoscope },
      { to: "/doctor/patient", label: "Patient Summary", icon: UserRound },
      { to: "/doctor/consultation", label: "Consultation", icon: Activity },
    ],
  },
  {
    title: "Emergency",
    role: "responder",
    items: [
      { to: "/emergency", label: "Triage Portal", icon: Siren },
      { to: "/emergency/log", label: "Access Audit Log", icon: ScrollText },
    ],
  },
  {
    title: "Platform",
    role: "judge",
    items: [
      { to: "/consent", label: "Consent Manager", icon: ShieldCheck },
      { to: "/offline", label: "Offline & Sync", icon: CloudOff },
      { to: "/architecture", label: "Architecture", icon: Network },
      { to: "/scenarios", label: "Demo Scenarios", icon: Presentation },
    ],
  },
];

const roleLabels: Record<Role, string> = {
  patient: "Patient · Rahul Sharma",
  doctor: "Doctor · Dr. Ananya Rao",
  responder: "Emergency Responder · Unit 108",
  judge: "Judge / Demo Guide",
};

export function AppShell({
  children,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const { state, set } = useStore();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HeartPulse className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight">SWASTHYASETU</span>
              <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                Unified Health Bridge
              </span>
            </span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <nav className="h-[calc(100vh-4rem)] space-y-6 overflow-y-auto px-3 py-5">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
              pathname === "/" && "bg-primary/10 text-primary",
            )}
          >
            <LayoutGrid className="size-4" /> Role Selection
          </Link>
          {groups.map((g) => (
            <div key={g.title}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {g.title}
              </p>
              <div className="space-y-1">
                {g.items.map((item) => {
                  const active = pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                        active && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-border bg-secondary/60 p-3">
            <p className="text-xs font-semibold">Prototype mode</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Simulated ABDM consent, offline sync and audit trail. No live patient data is used.
            </p>
          </div>
        </nav>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="lg:pl-72">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </Button>

          <div className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                state.online
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-warning/40 bg-warning/15 text-warning-foreground",
              )}
            >
              <span className={cn("size-1.5 rounded-full", state.online ? "bg-success" : "bg-warning")} />
              {state.online ? "Online · ABDM linked" : "Offline · cached mode"}
            </span>
            {state.syncQueue.length > 0 && (
              <Badge variant="outline" className="hidden sm:inline-flex">
                {state.syncQueue.filter((q) => q.status === "queued").length} pending sync
              </Badge>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <Bell className="size-4" />
                  <span className="hidden sm:inline">Alerts</span>
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unread}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notification Centre
                  <button
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() =>
                      set((s) => ({
                        ...s,
                        notifications: s.notifications.map((n) => ({ ...n, read: true })),
                      }))
                    }
                  >
                    Mark all read
                  </button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {state.notifications.length === 0 && (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground">No notifications</p>
                )}
                {state.notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="flex flex-col items-start gap-0.5 py-2"
                    onClick={() =>
                      set((s) => ({
                        ...s,
                        notifications: s.notifications.map((x) =>
                          x.id === n.id ? { ...x, read: true } : x,
                        ),
                      }))
                    }
                  >
                    <span className="flex w-full items-center gap-2 text-xs font-semibold">
                      {!n.read && <span className="size-1.5 rounded-full bg-primary" />}
                      {n.title}
                      <span className="ml-auto text-[10px] font-normal text-muted-foreground">{n.time}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{n.body}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserRound className="size-4" />
                  <span className="hidden max-w-40 truncate sm:inline">{roleLabels[state.role]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Switch active role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(roleLabels) as Role[]).map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => {
                      set((s) => ({ ...s, role: r }));
                      toast.success(`Role switched to ${roleLabels[r]}`);
                    }}
                  >
                    {roleLabels[r]}
                    {state.role === r && <Badge className="ml-auto">active</Badge>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="no-print mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                {description && (
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function StatBadge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
  children: ReactNode;
}) {
  const tones = {
    neutral: "border-border bg-secondary text-secondary-foreground",
    good: "border-success/30 bg-success/10 text-success",
    warn: "border-warning/40 bg-warning/15 text-warning-foreground",
    bad: "border-destructive/30 bg-destructive/10 text-destructive",
    info: "border-primary/30 bg-primary/10 text-primary",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function AlertStrip({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
      <AlertTriangle className="size-4 shrink-0" />
      {text}
    </div>
  );
}

export { BookOpenCheck };
