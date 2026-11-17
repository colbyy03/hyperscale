import { createContext, useContext } from "react";
import { db } from "@/db";

export interface LessonCtx {
  lessonId: string;
  moduleId: string;
  concepts: string[];
}

export const LessonContext = createContext<LessonCtx>({ lessonId: "", moduleId: "", concepts: [] });

export function useLesson(): LessonCtx {
  return useContext(LessonContext);
}

/** Record one attempt at an in-lesson item (prediction, check question, ...). */
export async function recordAttempt(args: {
  itemId: string;
  kind: string;
  correct: boolean;
  /** 0..1; defaults to 1 or 0 from `correct`. */
  score?: number;
  seconds: number;
  skills: string[];
  confidence?: number;
  payload?: unknown;
}): Promise<void> {
  await db.attempts.add({
    itemId: args.itemId,
    kind: args.kind,
    submittedAt: new Date().toISOString(),
    correct: args.correct,
    score: args.score ?? (args.correct ? 1 : 0),
    hintTier: 0,
    seconds: Math.round(args.seconds),
    confidence: args.confidence,
    skills: args.skills,
    payload: args.payload,
  });
}
