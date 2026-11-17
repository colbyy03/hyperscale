import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { Link } from "react-router";
import { PageHeader } from "@/components/ui";
import { vizRegistry } from "@/viz/registry";

const ControlRoom = vizRegistry.ControlRoom!;

export function ControlRoomPage() {
  return (
    <div>
      <Link to="/facility" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Facility
      </Link>
      <PageHeader eyebrow="Kestrel Ridge · Hall A" title="Plant Control Room">
        A live simulation of the data hall and its chilled-water plant. Pick a day, set the plant up, and run it. Your best valid runs are saved on this device.
      </PageHeader>
      <Suspense fallback={<div className="rounded-2xl border border-line p-6 text-center text-sm text-faint">Loading the Control Room…</div>}>
        <ControlRoom />
      </Suspense>
    </div>
  );
}
