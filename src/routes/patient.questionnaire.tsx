import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Languages, RotateCcw, Send, Sparkles, Stethoscope } from "lucide-react";
import { AppShell, AlertStrip, StatBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useStore, nowStamp, type TriageRecord } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/patient/questionnaire")({
  head: () => ({
    meta: [
      { title: "AI Triage & Symptom Questionnaire — SWASTHYASETU" },
      {
        name: "description",
        content:
          "Multilingual (English/Kannada) symptom questionnaire with simulated AI triage that updates the patient record and clinician notes.",
      },
      { property: "og:title", content: "AI Triage & Symptom Questionnaire — SWASTHYASETU" },
      {
        property: "og:description",
        content: "Simulated AI triage in English and Kannada, linked to the shared patient record.",
      },
    ],
  }),
  component: QuestionnairePage,
});

type Lang = "en" | "kn";

const SYMPTOMS: { key: string; en: string; kn: string; weight: number; red?: boolean }[] = [
  { key: "chest_pain", en: "Chest pain / tightness", kn: "ಎದೆ ನೋವು / ಬಿಗಿತ", weight: 5, red: true },
  { key: "breathless", en: "Breathlessness", kn: "ಉಸಿರಾಟದ ತೊಂದರೆ", weight: 5, red: true },
  { key: "fainting", en: "Fainting / blackout", kn: "ಮೂರ್ಛೆ ಹೋಗುವುದು", weight: 5, red: true },
  { key: "fever", en: "Fever", kn: "ಜ್ವರ", weight: 2 },
  { key: "high_sugar", en: "High blood sugar reading", kn: "ಅಧಿಕ ರಕ್ತದ ಸಕ್ಕರೆ", weight: 3 },
  { key: "headache", en: "Headache / dizziness", kn: "ತಲೆನೋವು / ತಲೆಸುತ್ತು", weight: 2 },
  { key: "foot_ulcer", en: "Foot wound not healing", kn: "ಗುಣವಾಗದ ಪಾದದ ಗಾಯ", weight: 3 },
  { key: "vomiting", en: "Nausea / vomiting", kn: "ವಾಕರಿಕೆ / ವಾಂತಿ", weight: 2 },
  { key: "cough", en: "Cough / cold", kn: "ಕೆಮ್ಮು / ಶೀತ", weight: 1 },
  { key: "fatigue", en: "Unusual tiredness", kn: "ಅಸಾಮಾನ್ಯ ಆಯಾಸ", weight: 1 },
];

const T = {
  en: {
    heading: "Tell us how you feel",
    sub: "Select everything that applies. You can switch language at any time.",
    duration: "How many days have you felt this?",
    severity: "How severe does it feel? (1 mild — 10 severe)",
    notes: "Anything else you want the doctor to know?",
    placeholder: "Describe your symptoms in your own words…",
    run: "Run AI triage",
    reset: "Clear answers",
    result: "AI triage result",
  },
  kn: {
    heading: "ನಿಮಗೆ ಹೇಗೆ ಅನಿಸುತ್ತಿದೆ ಎಂದು ತಿಳಿಸಿ",
    sub: "ಅನ್ವಯವಾಗುವ ಎಲ್ಲವನ್ನೂ ಆಯ್ಕೆಮಾಡಿ. ಯಾವಾಗ ಬೇಕಾದರೂ ಭಾಷೆ ಬದಲಾಯಿಸಬಹುದು.",
    duration: "ಎಷ್ಟು ದಿನಗಳಿಂದ ಈ ತೊಂದರೆ ಇದೆ?",
    severity: "ತೀವ್ರತೆ ಎಷ್ಟು? (1 ಸೌಮ್ಯ — 10 ತೀವ್ರ)",
    notes: "ವೈದ್ಯರಿಗೆ ಬೇರೆ ಏನಾದರೂ ತಿಳಿಸಬೇಕೆ?",
    placeholder: "ನಿಮ್ಮ ಮಾತಿನಲ್ಲಿ ಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ…",
    run: "AI ಟ್ರಯಾಜ್ ನಡೆಸಿ",
    reset: "ಉತ್ತರ ಅಳಿಸಿ",
    result: "AI ಟ್ರಯಾಜ್ ಫಲಿತಾಂಶ",
  },
} as const;

const LEVEL_TONE = {
  emergency: "bad",
  urgent: "warn",
  routine: "info",
  "self-care": "good",
} as const;

function QuestionnairePage() {
  const { state, set, logAudit } = useStore();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>(state.patient.language === "Kannada" ? "kn" : "en");
  const [selected, setSelected] = useState<string[]>([]);
  const [days, setDays] = useState(2);
  const [severity, setSeverity] = useState(4);
  const [freeText, setFreeText] = useState("");
  const [running, setRunning] = useState(false);
  const t = T[lang];
  const result = state.triage;

  const toggle = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));

  const run = () => {
    if (selected.length === 0 && !freeText.trim()) {
      toast.error(lang === "kn" ? "ಕನಿಷ್ಠ ಒಂದು ಲಕ್ಷಣ ಆಯ್ಕೆಮಾಡಿ" : "Select at least one symptom");
      return;
    }
    setRunning(true);
    setTimeout(() => {
      const picked = SYMPTOMS.filter((s) => selected.includes(s.key));
      const red = picked.some((s) => s.red);
      const score =
        picked.reduce((a, s) => a + s.weight, 0) + severity * 0.8 + Math.min(days, 10) * 0.2;
      const level: TriageRecord["level"] = red && severity >= 6
        ? "emergency"
        : red || score >= 8
          ? "urgent"
          : score >= 4
            ? "routine"
            : "self-care";

      const advice: Record<TriageRecord["level"], string> = {
        emergency:
          "Red-flag symptoms with high severity. Call 108 or reach the nearest emergency department immediately.",
        urgent: "Book a same-day consultation. Bring your glucose log and current medication list.",
        routine: "Schedule a routine OPD visit within a week and continue prescribed medication.",
        "self-care": "Home care, hydration and rest. Reassess if symptoms persist beyond 3 days.",
      };
      const dept = picked.some((s) => s.key === "chest_pain" || s.key === "breathless")
        ? "Cardiology"
        : picked.some((s) => s.key === "high_sugar" || s.key === "foot_ulcer")
          ? "Endocrinology"
          : "General Medicine";

      const record: TriageRecord = {
        id: `TRG-${Date.now().toString().slice(-6)}`,
        submittedAt: nowStamp(),
        language: lang,
        symptoms: picked.map((s) => s.en),
        freeText: freeText.trim(),
        durationDays: days,
        severity,
        level,
        advice: advice[level],
        suggestedDept: dept,
      };

      set((s) => ({
        ...s,
        triage: record,
        clinicalNotes: [
          {
            id: `CN-${s.clinicalNotes.length + 1}-${record.id}`,
            date: new Date().toISOString().slice(0, 10),
            author: "AI Triage Assistant (simulated)",
            text: `Patient-reported (${lang === "kn" ? "Kannada" : "English"}): ${
              record.symptoms.join(", ") || "free-text only"
            }. Duration ${days} day(s), severity ${severity}/10. Triage: ${level.toUpperCase()} → ${dept}. ${
              record.freeText ? `Patient note: "${record.freeText}"` : ""
            }`,
          },
          ...s.clinicalNotes,
        ],
        notifications: [
          {
            id: `N-${record.id}`,
            title: `AI triage: ${level}`,
            body: `${s.patient.name} submitted symptoms. Suggested ${dept}.`,
            time: "just now",
            read: false,
          },
          ...s.notifications,
        ],
        syncQueue: s.online
          ? s.syncQueue
          : [
              ...s.syncQueue,
              {
                id: `SQ-${record.id}`,
                label: "AI triage submission",
                kind: "triage",
                createdAt: nowStamp(),
                status: "queued" as const,
              },
            ],
      }));
      logAudit({
        actor: `${state.patient.name} (patient)`,
        action: "AI triage questionnaire submitted",
        scope: `Symptoms, triage level ${level}`,
      });
      setRunning(false);
      toast.success(`AI triage complete — ${level}`);
    }, 900);
  };

  return (
    <AppShell
      title="AI Triage & Symptom Questionnaire"
      description={`${state.patient.name} · ${state.patient.id} · Preferred language ${state.patient.language} · Simulated on-device AI model`}
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => setLang((l) => (l === "en" ? "kn" : "en"))}
          >
            <Languages className="size-4" /> {lang === "en" ? "ಕನ್ನಡ" : "English"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelected([]);
              setFreeText("");
              setDays(2);
              setSeverity(4);
              set((s) => ({ ...s, triage: null }));
              toast.success("Questionnaire cleared");
            }}
          >
            <RotateCcw className="size-4" /> {t.reset}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t.heading}</CardTitle>
            <CardDescription>{t.sub}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => {
                const on = selected.includes(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggle(s.key)}
                    className={
                      "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                      (on
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary")
                    }
                  >
                    {s.red && "⚠ "}
                    {lang === "en" ? s.en : s.kn}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  {t.duration} — <span className="font-semibold">{days}</span>
                </Label>
                <Slider
                  value={[days]}
                  min={1}
                  max={30}
                  step={1}
                  onValueChange={(v) => setDays(v[0] ?? 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t.severity} — <span className="font-semibold">{severity}</span>
                </Label>
                <Slider
                  value={[severity]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(v) => setSeverity(v[0] ?? 1)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.notes}</Label>
              <Textarea
                rows={4}
                value={freeText}
                placeholder={t.placeholder}
                onChange={(e) => setFreeText(e.target.value)}
              />
            </div>

            <Button onClick={run} disabled={running} size="lg">
              {running ? (
                <>
                  <Sparkles className="size-4 animate-pulse" /> Analysing…
                </>
              ) : (
                <>
                  <Send className="size-4" /> {t.run}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="size-4 text-primary" /> {t.result}
              </CardTitle>
              <CardDescription>Rule-based simulation — not a medical device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!result && (
                <p className="text-muted-foreground">
                  No triage submitted yet. Answer the questionnaire to generate a result.
                </p>
              )}
              {result && (
                <>
                  {result.level === "emergency" && (
                    <AlertStrip text="Emergency triage — seek immediate care / call 108" />
                  )}
                  <div className="flex items-center justify-between">
                    <span>Triage level</span>
                    <StatBadge tone={LEVEL_TONE[result.level]}>{result.level}</StatBadge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Suggested department</span>
                    <span className="font-medium">{result.suggestedDept}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Severity reported</span>
                    <span className="font-medium">{result.severity}/10 · {result.durationDays}d</span>
                  </div>
                  <p className="rounded-md border border-border bg-secondary/50 p-3 text-xs leading-relaxed">
                    {result.advice}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Symptoms: {result.symptoms.join(", ") || "—"} · Submitted {result.submittedAt} in{" "}
                    {result.language === "kn" ? "Kannada" : "English"}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate({ to: "/doctor/patient" })}
                  >
                    <Stethoscope className="size-4" /> View in clinician summary
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Known record used by the model</CardTitle>
              <CardDescription>Pulled from the shared patient state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm text-muted-foreground">
              <p>Conditions: {state.patient.conditions.join(", ")}</p>
              <p>Allergies: {state.patient.allergies.join(", ")}</p>
              <p>Medications: {state.patient.medications.map((m) => m.name).join(", ")}</p>
              <p>Blood group: {state.patient.bloodGroup}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
