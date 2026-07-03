import { describe, expect, test } from "bun:test";

import { parseMillerIndicesInput } from "../src/app/controls/commonPanel/DisplayTab";

describe("Miller indices input parsing", () => {
  test("parses space and comma separated indices", () => {
    expect(parseMillerIndicesInput("1 1 1")).toEqual([1, 1, 1]);
    expect(parseMillerIndicesInput("1, 0, -1")).toEqual([1, 0, -1]);
    expect(parseMillerIndicesInput("  2  0  4 ")).toEqual([2, 0, 4]);
  });

  test("parses compact crystallographic notation", () => {
    expect(parseMillerIndicesInput("111")).toEqual([1, 1, 1]);
    expect(parseMillerIndicesInput("110")).toEqual([1, 1, 0]);
    expect(parseMillerIndicesInput("1-10")).toEqual([1, -1, 0]);
    expect(parseMillerIndicesInput("-101")).toEqual([-1, 0, 1]);
  });

  test("rejects text that is not three integers or is all zeros", () => {
    expect(parseMillerIndicesInput("")).toBeNull();
    expect(parseMillerIndicesInput("1 1")).toBeNull();
    expect(parseMillerIndicesInput("1 1 1 1")).toBeNull();
    expect(parseMillerIndicesInput("abc")).toBeNull();
    expect(parseMillerIndicesInput("0 0 0")).toBeNull();
    expect(parseMillerIndicesInput("000")).toBeNull();
  });
});
