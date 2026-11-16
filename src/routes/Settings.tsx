import { Download, RotateCcw, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Card, PageHeader, SectionTitle } from "@/components/ui";
import { baseCalendar } from "@/content";
import { db, requestPersistentStorage } from "@/db";
import { exportAll, importAll, parseBackup, previewImport, type BackupFile } from "@/db/backup";
import type { PeriodType } from "@/engine/schedule";
import { formatDate, useSchedule } from "@/hooks/data";
import { setSetting, useSettings, type Theme } from "@/state/settings";

const PERIODS: PeriodType[] = ["teaching", "blockWeek5", "break", "capstone", "summer"];

function TimeBudget() {
  const settings = useSettings();
  const schedule = useSchedule();
  const budget = { ...baseCalendar.timeBudget, ...settings.timeBudget };
  const update = (p: PeriodType, field: "weekday" | "weekend", value: number) => {
    const next = { ...settings.timeBudget, [p]: { ...budget[p], [field]: Math.max(0, Math.min(600, Math.round(value))) } };
    void setSetting("timeBudget", next);
  };
  return (
    <Card>
      <SectionTitle
        action={
          Object.keys(settings.timeBudget).length > 0 && (
            <Button variant="ghost" onClick={() => void setSetting("timeBudget", {})}>
              <RotateCcw size={14} /> Reset
            </Button>
          )
        }
      >
        Time budget (minutes per day)
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="text-left text-xs text-faint">
              <th className="py-2 font-medium">Period</th>
              <th className="py-2 font-medium">Weekdays</th>
              <th className="py-2 font-medium">Weekend days</th>
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p) => (
              <tr key={p} className="border-t border-line">
                <td className="py-2 pr-3">{baseCalendar.timeBudget[p].label ?? p}</td>
                {(["weekday", "weekend"] as const).map((f) => (
                  <td key={f} className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      max={600}
                      step={15}
                      value={budget[p][f]}
                      onChange={(e) => update(p, f, Number(e.target.value))}
                      className="w-24 rounded-lg border border-line bg-surface-2 px-2 py-1 tabular-nums"
                      aria-label={`${p} ${f} minutes`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted">
        With this budget you have <b className="text-ink">{Math.round(schedule.capacityHours)} h</b> for <b className="text-ink">{Math.round(schedule.neededHours)} h</b> of planned work. The final
        module finishes {schedule.spans["capstone-2"]?.end ? formatDate(schedule.spans["capstone-2"].end, { month: "long", day: "numeric", year: "numeric" }) : "after the course window"}.
      </p>
    </Card>
  );
}

function Backup() {
  const settings = useSettings();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersisted);
  }, []);

  const doExport = async () => {
    const file = await exportAll(db);
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hyperscale-backup-${file.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    await setSetting("lastBackupAt", file.exportedAt);
    setMessage("Backup saved to your downloads.");
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      setPending(parseBackup(await f.text()));
      setMessage(null);
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  const apply = async (mode: "replace" | "merge") => {
    if (!pending) return;
    const s = await importAll(db, pending, mode);
    setPending(null);
    setMessage(`Imported (${mode}): ${Object.entries(s.counts).filter(([, n]) => n).map(([t, n]) => `${n} ${t}`).join(", ") || "nothing"}.`);
  };

  return (
    <Card>
      <SectionTitle>Backup and restore</SectionTitle>
      <p className="mb-3 text-sm text-muted">
        Your progress lives only in this browser. Export a backup now and then; restore it on any device. Your tutor API key is never included.
        {settings.lastBackupAt && <> Last backup: {formatDate(settings.lastBackupAt.slice(0, 10))}.</>}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void doExport()}>
          <Download size={15} /> Export backup
        </Button>
        <Button onClick={() => fileInput.current?.click()}>
          <Upload size={15} /> Import backup
        </Button>
        <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>
      {pending && (
        <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3 text-sm">
          <div className="mb-2">
            Backup from {formatDate(pending.exportedAt.slice(0, 10))}:{" "}
            {Object.entries(previewImport(pending))
              .filter(([, n]) => n)
              .map(([t, n]) => `${n} ${t}`)
              .join(", ")}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void apply("merge")}>
              Merge into current data
            </Button>
            <Button variant="danger" onClick={() => void apply("replace")}>
              Replace current data
            </Button>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {message && <p className="mt-3 text-sm text-muted" role="status">{message}</p>}
      <p className="mt-4 text-xs text-faint">
        Storage protection: {persisted === null ? "checking…" : persisted ? "on (the browser won't evict your data)" : "off"}.{" "}
        {!persisted && (
          <button className="underline" onClick={() => void requestPersistentStorage().then(setPersisted)}>
            Request it
          </button>
        )}{" "}
        Installing Hyperscale to your home screen also protects it on iPhone and iPad.
      </p>
    </Card>
  );
}

function Appearance() {
  const settings = useSettings();
  const options: Theme[] = ["system", "dark", "light"];
  return (
    <Card>
      <SectionTitle>Appearance</SectionTitle>
      <div className="flex gap-2" role="radiogroup" aria-label="Theme">
        {options.map((t) => (
          <Button key={t} variant={settings.theme === t ? "primary" : "secondary"} role="radio" aria-checked={settings.theme === t} onClick={() => void setSetting("theme", t)}>
            {t[0]!.toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>
    </Card>
  );
}

function DangerZone() {
  const [armed, setArmed] = useState(false);
  const reset = async () => {
    await db.delete();
    location.reload();
  };
  return (
    <Card>
      <SectionTitle>Reset</SectionTitle>
      <p className="mb-3 text-sm text-muted">Delete all progress, attempts, cards and settings from this browser. Export a backup first if you might want them back.</p>
      {armed ? (
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => void reset()}>
            Yes, delete everything
          </Button>
          <Button variant="ghost" onClick={() => setArmed(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="danger" onClick={() => setArmed(true)}>
          Reset all data…
        </Button>
      )}
    </Card>
  );
}

export function Settings() {
  return (
    <div>
      <PageHeader eyebrow="Settings" title="Settings" />
      <div className="flex flex-col gap-5">
        <TimeBudget />
        <Appearance />
        <Backup />
        <DangerZone />
      </div>
    </div>
  );
}
