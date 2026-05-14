import { describe, expect, it } from "vitest";
import { createEmptyScanResult } from "../../src/core/logScanner";
import { WorkspaceScanCache } from "../../src/core/scanCache";

describe("WorkspaceScanCache", () => {
  it("returns cached results until forced or invalidated", async () => {
    let calls = 0;
    const cache = new WorkspaceScanCache(async () => createEmptyScanResult(++calls));

    await expect(cache.getCachedOrScan()).resolves.toMatchObject({ scannedFiles: 1 });
    await expect(cache.getCachedOrScan()).resolves.toMatchObject({ scannedFiles: 1 });
    expect(calls).toBe(1);

    await expect(cache.scanFresh()).resolves.toMatchObject({ scannedFiles: 2 });
    cache.invalidate();
    await expect(cache.getCachedOrScan()).resolves.toMatchObject({ scannedFiles: 3 });
  });

  it("shares in-flight scans for repeated board opens", async () => {
    let calls = 0;
    const cache = new WorkspaceScanCache(async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return createEmptyScanResult(calls);
    });

    const [first, second] = await Promise.all([cache.getCachedOrScan(), cache.getCachedOrScan()]);

    expect(first.scannedFiles).toBe(1);
    expect(second.scannedFiles).toBe(1);
    expect(calls).toBe(1);
  });

  it("invalidates cached results when the cache key changes", async () => {
    let calls = 0;
    let key = "methods:log";
    const cache = new WorkspaceScanCache(
      async () => createEmptyScanResult(++calls),
      () => key
    );

    await expect(cache.getCachedOrScan()).resolves.toMatchObject({ scannedFiles: 1 });
    key = "methods:error";
    await expect(cache.getCachedOrScan()).resolves.toMatchObject({ scannedFiles: 2 });
  });
});
