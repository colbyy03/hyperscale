import { describe, expect, it } from "vitest";
import { judgeOrder, shuffledOrder } from "./ParsonsExercise";

const block = (at: number, text = `line ${at}`) => ({ text, at });

describe("Parsons problems", () => {
  it("shuffles the same way every time and never starts solved", () => {
    const a = shuffledOrder(6, 5, "python-mle/x");
    expect(shuffledOrder(6, 5, "python-mle/x")).toEqual(a);
    expect([...a].sort()).toEqual([0, 1, 2, 3, 4, 5]);
    for (const seed of ["a", "b", "c", "d", "e", "f", "g"]) {
      const order = shuffledOrder(4, 4, seed);
      expect(order).not.toEqual([0, 1, 2, 3]);
    }
  });

  it("points at the first problem: a distractor, a misplaced line, or missing lines", () => {
    expect(judgeOrder([block(0), block(-1), block(1)], 3)).toMatchObject({ correct: false, wrongAt: 1, message: expect.stringContaining("doesn't belong") });
    expect(judgeOrder([block(0), block(2), block(1)], 3)).toMatchObject({ correct: false, wrongAt: 1 });
    expect(judgeOrder([block(0), block(1)], 3)).toMatchObject({ correct: false, message: "1 more line needed." });
    expect(judgeOrder([block(0), block(1), block(2)], 3).correct).toBe(true);
  });
});
