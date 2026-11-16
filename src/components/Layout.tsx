import clsx from "clsx";
import {
  BookOpen,
  Building2,
  CalendarCheck,
  FolderKanban,
  Gauge,
  Library,
  Menu,
  Repeat,
  Settings as SettingsIcon,
  Sun,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { curriculum } from "@/content";
import { daysUntil, formatDate, useSchedule, useToday } from "@/hooks/data";
import { useSettings } from "@/state/settings";
import { useApplyTheme } from "@/state/theme";
import { UpdatePrompt } from "@/pwa";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: "/", label: "Today", icon: <Sun size={18} />, end: true },
  { to: "/learn", label: "Learn", icon: <BookOpen size={18} /> },
  { to: "/practice", label: "Practice", icon: <Target size={18} /> },
  { to: "/review", label: "Review", icon: <Repeat size={18} /> },
  { to: "/facility", label: "Facility", icon: <Building2 size={18} /> },
  { to: "/projects", label: "Projects", icon: <FolderKanban size={18} /> },
  { to: "/progress", label: "Progress", icon: <Gauge size={18} /> },
  { to: "/sources", label: "Sources", icon: <Library size={18} /> },
  { to: "/settings", label: "Settings", icon: <SettingsIcon size={18} /> },
];

const MOBILE_TABS = NAV.filter((n) => ["/", "/learn", "/review", "/facility"].includes(n.to));

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--surface-3)" />
        <path d="M9 22V10M16 22V10M23 22V10" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M9 16h14" stroke="var(--heat)" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">Hyperscale</span>
    </div>
  );
}

function MilestoneChip() {
  const schedule = useSchedule();
  const today = useToday();
  const next = curriculum.milestones
    .map((m) => ({ ...m, date: schedule.spans[m.after]?.end }))
    .find((m) => m.date && m.date >= today.date);
  if (!next?.date) return null;
  const days = daysUntil(next.date, today.date);
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3 text-xs">
      <div className="flex items-center gap-1.5 text-faint">
        <CalendarCheck size={13} /> Next milestone
      </div>
      <div className="mt-1 font-medium text-ink">
        {next.id} · {next.title}
      </div>
      <div className="mt-0.5 text-muted">
        {formatDate(next.date)} · {days} days
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              isActive ? "bg-surface-3 font-medium text-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
            )
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Layout() {
  const settings = useSettings();
  useApplyTheme(settings.theme);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const today = useToday();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line bg-bg px-4 py-5 md:flex">
        <Logo />
        <NavLinks />
        <div className="mt-auto flex flex-col gap-3">
          <MilestoneChip />
          <div className="px-1 text-xs text-faint">
            Week {Math.max(today.week, 0)} · {today.periodLabel}
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        <button className="rounded-lg p-2 text-muted hover:text-ink" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {menuOpen && (
        <div className="fixed inset-x-0 top-[57px] z-30 border-b border-line bg-bg p-4 md:hidden">
          <NavLinks onNavigate={() => setMenuOpen(false)} />
          <div className="mt-4">
            <MilestoneChip />
          </div>
        </div>
      )}

      <main className="mx-auto w-full min-w-0 max-w-5xl px-4 pt-6 pb-28 sm:px-6 md:px-10 md:pt-10 md:pb-16">
        <Outlet />
      </main>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Tabs">
        {MOBILE_TABS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => clsx("flex flex-col items-center gap-1 py-2.5 text-[11px]", isActive ? "text-accent" : "text-muted")}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <UpdatePrompt />
    </div>
  );
}
