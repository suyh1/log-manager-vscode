import { LogManagerConfig } from "../config";
import { ScanResult } from "../domain/logTypes";

interface CachedScanResult {
  key: string;
  result: ScanResult;
}

export class WorkspaceScanCache {
  private cached: CachedScanResult | undefined;
  private inFlight: Promise<ScanResult> | undefined;

  constructor(
    private readonly scan: () => Promise<ScanResult>,
    private readonly getCacheKey: () => string = () => "default"
  ) {}

  async getCachedOrScan(): Promise<ScanResult> {
    const key = this.getCacheKey();

    if (this.cached?.key === key) {
      return this.cached.result;
    }

    if (this.inFlight) {
      return this.inFlight;
    }

    return this.scanAndCache(key);
  }

  async scanFresh(): Promise<ScanResult> {
    return this.scanAndCache(this.getCacheKey());
  }

  invalidate(): void {
    this.cached = undefined;
  }

  private async scanAndCache(key: string): Promise<ScanResult> {
    this.inFlight = this.scan()
      .then((result) => {
        this.cached = { key, result };
        return result;
      })
      .finally(() => {
        this.inFlight = undefined;
      });

    return this.inFlight;
  }
}

export function createScanCacheKey(config: LogManagerConfig): string {
  return JSON.stringify({
    enabledMethods: config.enabledMethods,
    generatedMarker: config.generatedMarker,
    preserveMarker: config.preserveMarker,
    excludeGlobs: config.excludeGlobs
  });
}
