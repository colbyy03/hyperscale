import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Layout } from "@/components/Layout";
import { Facility } from "@/routes/Facility";
import { Learn } from "@/routes/Learn";
import { ModulePage } from "@/routes/ModulePage";
import { NotFound } from "@/routes/NotFound";
import { Projects } from "@/routes/Projects";
import { Today } from "@/routes/Today";

// Heavier screens are code-split: the lesson player (MDX + KaTeX), reviews (KaTeX), practice and
// checkpoints (question views, code runner) and the bibliography (large JSON).
const LessonPage = lazy(() => import("@/routes/LessonPage").then((m) => ({ default: m.LessonPage })));
const Checkpoint = lazy(() => import("@/routes/Checkpoint").then((m) => ({ default: m.Checkpoint })));
const Review = lazy(() => import("@/routes/Review").then((m) => ({ default: m.Review })));
const ExitRecall = lazy(() => import("@/routes/Review").then((m) => ({ default: m.ExitRecall })));
const Practice = lazy(() => import("@/routes/Practice").then((m) => ({ default: m.Practice })));
const PracticeSession = lazy(() => import("@/routes/Practice").then((m) => ({ default: m.PracticeSession })));
const ExercisePage = lazy(() => import("@/routes/Practice").then((m) => ({ default: m.ExercisePage })));
const ControlRoomPage = lazy(() => import("@/routes/ControlRoomPage").then((m) => ({ default: m.ControlRoomPage })));
const Progress = lazy(() => import("@/routes/Progress").then((m) => ({ default: m.Progress })));
const Sources = lazy(() => import("@/routes/Sources").then((m) => ({ default: m.Sources })));
const Settings = lazy(() => import("@/routes/Settings").then((m) => ({ default: m.Settings })));

function Loading() {
  return <div className="py-16 text-center text-sm text-faint">Loading…</div>;
}

const suspended = (node: ReactNode) => <Suspense fallback={<Loading />}>{node}</Suspense>;

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { index: true, element: <Today /> },
        { path: "learn", element: <Learn /> },
        { path: "learn/:moduleId", element: <ModulePage /> },
        { path: "learn/:moduleId/checkpoint", element: suspended(<Checkpoint />) },
        { path: "learn/:moduleId/:lessonSlug", element: suspended(<LessonPage />) },
        { path: "practice", element: suspended(<Practice />) },
        { path: "practice/session", element: suspended(<PracticeSession />) },
        { path: "practice/exercise/:moduleId/:slug", element: suspended(<ExercisePage />) },
        { path: "review", element: suspended(<Review />) },
        { path: "review/exit", element: suspended(<ExitRecall />) },
        { path: "facility", element: <Facility /> },
        { path: "facility/control-room", element: suspended(<ControlRoomPage />) },
        { path: "projects", element: <Projects /> },
        { path: "progress", element: suspended(<Progress />) },
        { path: "sources", element: suspended(<Sources />) },
        { path: "settings", element: suspended(<Settings />) },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  { basename },
);

export function App() {
  return <RouterProvider router={router} />;
}
