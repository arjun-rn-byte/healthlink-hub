import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Eye, FileText, FlaskConical, Scan, Share2, Upload } from "lucide-react";
import { AppShell, StatBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore, nowStamp, type DocumentRecord } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/patient/documents")({
  head: () => ({
    meta: [
      { title: "Health Locker — SWASTHYASETU" },
      {
        name: "description",
        content:
          "Lab reports, prescriptions and radiology films stored in one secure, shareable personal health locker.",
      },
      { property: "og:title", content: "Health Locker — SWASTHYASETU" },
      {
        property: "og:description",
        content: "Lab reports, prescriptions and radiology films in one secure locker.",
      },
    ],
  }),
  component: DocumentsPage,
});

const typeIcon = {
  "Lab Report": FlaskConical,
  Prescription: FileText,
  Radiology: Scan,
  "Discharge Summary": FileText,
} as const;

function DocumentsPage() {
  const { state, set, logAudit } = useStore();
  const [tab, setTab] = useState<"all" | DocumentRecord["type"]>("all");
  const [preview, setPreview] = useState<DocumentRecord | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    type: "Lab Report" as DocumentRecord["type"],
    facility: "Apollo Diagnostics",
  });

  const docs = tab === "all" ? state.documents : state.documents.filter((d) => d.type === tab);

  const runUpload = () => {
    if (!draft.name.trim()) {
      toast.error("Give the document a name first");
      return;
    }
    setUploading(true);
    setProgress(0);
    let p = 0;
    const timer = setInterval(() => {
      p += 20;
      setProgress(p);
      if (p >= 100) {
        clearInterval(timer);
        const doc: DocumentRecord = {
          id: `DOC-${Date.now()}`,
          name: draft.name.trim(),
          type: draft.type,
          date: new Date().toISOString().slice(0, 10),
          facility: draft.facility,
          size: `${(Math.random() * 2 + 0.2).toFixed(1)} MB`,
          summary: "Uploaded by patient. Awaiting clinician review and structured data extraction.",
        };
        set((s) => ({
          ...s,
          documents: [doc, ...s.documents],
          syncQueue: s.online
            ? s.syncQueue
            : [
                ...s.syncQueue,
                {
                  id: `SYNC-${Date.now()}`,
                  label: `Document upload: ${doc.name}`,
                  kind: "document",
                  createdAt: nowStamp(),
                  status: "queued" as const,
                },
              ],
        }));
        logAudit({ actor: "Rahul Sharma (self)", action: "Document uploaded", scope: doc.type });
        setUploading(false);
        setUploadOpen(false);
        setDraft({ name: "", type: "Lab Report", facility: "Apollo Diagnostics" });
        toast.success(state.online ? "Document added to locker" : "Document cached — will upload on reconnect");
      }
    }, 220);
  };

  return (
    <AppShell
      title="Health locker"
      description="Every report, prescription and scan in one place — encrypted at rest and shared only with your consent."
      actions={
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="size-4" /> Upload document
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All ({state.documents.length})</TabsTrigger>
          <TabsTrigger value="Lab Report">Lab reports</TabsTrigger>
          <TabsTrigger value="Prescription">Prescriptions</TabsTrigger>
          <TabsTrigger value="Radiology">Radiology</TabsTrigger>
          <TabsTrigger value="Discharge Summary">Discharge</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {docs.map((d) => {
          const Icon = typeIcon[d.type];
          return (
            <Card key={d.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-sm">{d.name}</CardTitle>
                    <CardDescription className="truncate">
                      {d.facility} · {d.date}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <div className="flex items-center gap-2">
                  <StatBadge tone="info">{d.type}</StatBadge>
                  <span className="text-xs text-muted-foreground">{d.size}</span>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{d.summary}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setPreview(d)}>
                    <Eye className="size-4" /> Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      logAudit({
                        actor: "Rahul Sharma (self)",
                        action: "Document downloaded",
                        scope: d.name,
                      });
                      toast.success(`${d.name} downloaded`);
                    }}
                  >
                    <Download className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {docs.length === 0 && (
          <p className="text-sm text-muted-foreground">No documents in this category yet.</p>
        )}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>
              {preview?.facility} · {preview?.date} · {preview?.size}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-secondary/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Extracted structured summary
            </p>
            <p className="mt-2 text-sm leading-relaxed">{preview?.summary}</p>
            <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
              {["Verified source", "Digitally signed", "FHIR R4 mapped"].map((x) => (
                <div key={x} className="rounded-md border border-border bg-card p-2 text-center">
                  {x}
                </div>
              ))}
            </div>
            <div className="mt-4 flex h-40 items-center justify-center rounded-md border border-dashed border-border bg-card text-xs text-muted-foreground">
              Document render preview (simulated)
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                logAudit({
                  actor: "Rahul Sharma (self)",
                  action: "Document shared with clinician",
                  scope: preview?.name ?? "Document",
                });
                toast.success("Shared with Dr. Meera Iyer for 7 days");
              }}
            >
              <Share2 className="size-4" /> Share
            </Button>
            <Button onClick={() => setPreview(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={(o) => !uploading && setUploadOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload to health locker</DialogTitle>
            <DialogDescription>
              Simulated upload — the file is indexed, tagged and added to your timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="docname">Document name</Label>
              <Input
                id="docname"
                placeholder="e.g. Thyroid Profile — Nov"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={draft.type}
                onValueChange={(v) => setDraft({ ...draft, type: v as DocumentRecord["type"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Lab Report", "Prescription", "Radiology", "Discharge Summary"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="facility">Source facility</Label>
              <Input
                id="facility"
                value={draft.facility}
                onChange={(e) => setDraft({ ...draft, facility: e.target.value })}
              />
            </div>
            <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
              Drop a file here (simulated)
            </div>
            {uploading && <Progress value={progress} />}
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={uploading} onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={runUpload} disabled={uploading}>
              {uploading ? `Uploading ${progress}%` : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
