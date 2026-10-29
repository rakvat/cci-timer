import assert from "node:assert/strict";
import test from "node:test";
import { getSuggestedWarningTime } from "./warning-time.ts";

test("suggests one tenth of the duration rounded down when warning time is focused", () => {
  assert.equal(getSuggestedWarningTime("59"), "5");
  assert.equal(getSuggestedWarningTime("9"), "");
});
