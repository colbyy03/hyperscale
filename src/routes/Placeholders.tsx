import { Repeat, Target } from "lucide-react";
import { Link } from "react-router";
import { EmptyState, PageHeader } from "@/components/ui";

export function Review() {
  return (
    <div>
      <PageHeader eyebrow="Spaced repetition" title="Review">
        Cards from every lesson you complete, scheduled by FSRS to resurface just before you'd forget them.
      </PageHeader>
      <EmptyState title="No cards due" icon={<Repeat size={28} />}>
        Review cards are created as you finish lessons once the learning engine ships. Your daily session will mix them in automatically.
      </EmptyState>
    </div>
  );
}

export function Practice() {
  return (
    <div>
      <PageHeader eyebrow="Interleaved practice" title="Practice">
        Weak spots, the challenge of the day, and drills by concept.
      </PageHeader>
      <EmptyState title="Nothing to practice yet" icon={<Target size={28} />}>
        Practice sets draw on exercises you've already met. Start with <Link to="/learn" className="text-accent underline">the first module</Link>.
      </EmptyState>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="py-16">
      <EmptyState title="Page not found">
        That page doesn't exist. <Link to="/" className="text-accent underline">Go to Today</Link>.
      </EmptyState>
    </div>
  );
}
