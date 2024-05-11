import { Worker } from 'node:worker_threads';
import { join } from 'node:path';
import type { PackageContent, DynamicLoaderOptions } from './types.js';
import { PackageMatcher } from './PackageMatcher.js';

export abstract class AbstractDynamicLoader {
  private readonly options: DynamicLoaderOptions;
  private readonly matcher = new PackageMatcher();

  public constructor(
    options: DynamicLoaderOptions = {},
  ) {
    if (options.registry) {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+\.[a-z.]{2,6}|[\d.]+)([/:?=&#]{1}[\da-z.-]+)*[/?]?$/;
      if (!urlRegex.test(options.registry)) {
        throw new Error('Invalid registry URL');
      }
    } else {
      options.registry = 'https://registry.npmjs.org';
    }
    this.options = options;
  }

  protected async fetchPackageContent(packageName: string, version: string): Promise<PackageContent> {
    return new Promise((resolve, reject) => {
      const packageUrl = `${this.options.registry}/${packageName}/${version}`;
      const worker = new Worker(join(__dirname, './loadPackageWorker.js'), {
        workerData: packageUrl,
      });
      worker.on('message', resolve);
      worker.on('error', reject);
    });
  }

  protected getIsPackageAllowed(packageName: string, packageVersion: string): boolean {
    if (this.options.include && !this.matcher.getIsMatched(packageName, packageVersion, this.options.include)) {
      return false;
    }
    if (this.options.exclude && this.matcher.getIsMatched(packageName, packageVersion, this.options.exclude)) {
      return false;
    }
    return true;
  }

  public abstract getAsset(packageName: string, version: string, assetPath: string): Promise<Buffer | null>;
}
