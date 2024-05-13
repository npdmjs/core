import { Worker } from 'node:worker_threads';
import { join } from 'node:path';
import { PackageMatcher } from './PackageMatcher.js';
import { RestrictedPackageError } from './RestrictedPackageError.js';
import type { PackageContent, PackageLoaderOptions } from './types.js';

/**
 * Manages the loading of package contents from a registry.
 * Supports configuration of allow list to include or exclude specific packages based on their names and versions.
 */
export class PackageLoader {
  private readonly options: PackageLoaderOptions;
  private readonly pkgMatcher = new PackageMatcher();

  public constructor(
    options: PackageLoaderOptions = {},
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

  /**
   * Fetches the package content from the registry using a separate worker thread to avoid blocking the main thread.
   * @param packageName - The name of the package to fetch.
   * @param version - The version of the package to fetch.
   * @returns A promise that resolves to the content of the package.
   * @throws {RestrictedPackageError} If the requested package is restricted by the include/exclude options.
   */
  public async fetchPackageContent(packageName: string, version: string): Promise<PackageContent> {
    if (!this.getIsPackageAllowed(packageName, version)) {
      throw new RestrictedPackageError(packageName, version);
    }

    return new Promise((resolve, reject) => {
      const packageUrl = `${this.options.registry}/${packageName}/${version}`;
      const worker = new Worker(join(__dirname, './loadPackageWorker.js'), {
        workerData: packageUrl,
      });
      worker.on('message', resolve);
      worker.on('error', reject);
    });
  }

  /**
   * Determines if a package is allowed based on the include and exclude rules specified in the options.
   * @private
   * @param {string} packageName - The name of the package.
   * @param {string} packageVersion - The version of the package.
   * @returns {boolean} True if the package is allowed, false otherwise.
   */
  private getIsPackageAllowed(packageName: string, packageVersion: string): boolean {
    if (this.options.include && !this.pkgMatcher.getIsMatched(packageName, packageVersion, this.options.include)) {
      return false;
    }
    if (this.options.exclude && this.pkgMatcher.getIsMatched(packageName, packageVersion, this.options.exclude)) {
      return false;
    }
    return true;
  }
}
