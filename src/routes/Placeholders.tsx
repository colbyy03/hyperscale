import { Link } from "react-router";
import { EmptyState } from "@/components/ui";

export function NotFound() {
  return (
    <div className="py-16">
      <EmptyState title="Page not found">
        That page doesn't exist. <Link to="/" className="text-accent underline">Go to Today</Link>.
      </EmptyState>
    </div>
  );
}
