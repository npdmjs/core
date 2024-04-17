import { Worker } from 'node:worker_threads';
import { join } from 'node:path';
import type { PackageContent } from './PackageContent.js';

export abstract class AbstractDynamicLoader {
  public constructor(
    /** default https://registry.npmjs.org */
    protected readonly registry = 'https://registry.npmjs.org',
  ) {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+\.[a-z.]{2,6}|[\d.]+)([/:?=&#]{1}[\da-z.-]+)*[/?]?$/;
    if (!urlRegex.test(this.registry)) {
      throw new Error('Invalid registry URL');
    }
  }

  protected async fetchPackageContent(packageName: string, version: string): Promise<PackageContent> {
    return new Promise((resolve, reject) => {
      const packageUrl = `${this.registry}/${packageName}/${version}`;
      const worker = new Worker(join(__dirname, './loadPackageWorker.js'), {
        workerData: packageUrl,
      });
      worker.on('message', resolve);
      worker.on('error', reject);
    });
  }

  public abstract getAsset(packageName: string, version: string, assetPath: string): Promise<Buffer | null>;
}
