import { Worker } from 'node:worker_threads';
import type { PackageContent } from './PackageContent.js';

export abstract class DynamicLoader {
  public constructor(
    protected readonly registry: string,
  ) {}

  protected async fetchPackageContent(packageName: string, version: string): Promise<PackageContent> {
    return new Promise((resolve, reject) => {
      const packageUrl = `${this.registry}/${packageName}/${version}`;
      const worker = new Worker('./loadPackageWorker.js', {
        workerData: packageUrl,
      });
      worker.on('message', resolve);
      worker.on('error', reject);
    });
  }

  public abstract getAsset(packageName: string, version: string, assetPath: string): Promise<Buffer | null>;
}
