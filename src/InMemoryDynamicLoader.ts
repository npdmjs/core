import { Store, create as createMemFs } from 'mem-fs';
import { create as createMemFsEditor } from 'mem-fs-editor';
import { PackageLoader } from './PackageLoader.js';
import type { InMemoryDynamicLoaderOptions, PackageContent } from './types.js';
import { ExpirableMap } from './ExpirableMap.js';

/**
 * Manages the in-memory caching of package contents, allowing dynamic retrieval of package assets.
 * This loader supports expirable caching mechanisms if a time-to-live (TTL) is specified in the options.
 */
export class InMemoryDynamicLoader {
  private readonly pkgCache: Map<string, Store>;
  private readonly pkgLoader: PackageLoader;
  private readonly pkgContentFetchPromises = new Map<string, Promise<PackageContent>>();

  constructor(options: InMemoryDynamicLoaderOptions = {}) {
    this.pkgLoader = new PackageLoader(options);
    if (options.ttl) {
      this.pkgCache = new ExpirableMap<string, Store>(options.ttl);
    } else {
      this.pkgCache = new Map();
    }
  }

  /**
   * Retrieves a specific asset from a package. If the asset is not cached, it fetches and caches the package contents.
   * @param packageName - The name of the package from which to fetch the asset.
   * @param version - The version of the package.
   * @param assetPath - The path to the specific asset within the package.
   * @returns {Promise<Buffer | null>} A promise that resolves to the asset data.
   * @throws RestrictedPackageError
   */
  public async getAsset(packageName: string, version: string, assetPath: string): Promise<Buffer | null> {
    const key = `${packageName}@${version}`;
    if (!this.pkgCache.has(key)) {
      await this.ensurePackageContentIsFetched(key, packageName, version);
    }
    return this.pkgCache.get(key)?.get(assetPath).contents as Buffer | null;
  }

  /**
   * Ensures the package content is fetched and cached, if it's not already being fetched or cached.
   * This method handles simultaneous requests by waiting for an ongoing fetch to complete.
   * @private
   * @param key - The cache key, composed of the package name and version.
   * @param packageName - The package name.
   * @param version - The package version.
   * @throws RestrictedPackageError
   */
  private async ensurePackageContentIsFetched(key: string, packageName: string, version: string): Promise<void> {
    if (this.pkgContentFetchPromises.has(key)) {
      // for the case if there was another request and we are already fetching the package content, wait for it:
      await this.pkgContentFetchPromises.get(key);
    } else {
      // we need to fetch the package content:
      const fetchContentPromise = this.pkgLoader.fetchPackageContent(packageName, version);
      const store: Store = createMemFs();
      const fsEditor = createMemFsEditor(store);
      // make loading visible for other requests:
      this.pkgContentFetchPromises.set(key, fetchContentPromise);

      const packageContent = await fetchContentPromise;
      packageContent.forEach(
        ({ path, content }) => fsEditor.write(path, Buffer.from(content)),
      );

      this.pkgCache.set(key, store);
      this.pkgContentFetchPromises.delete(key);
    }
  }
}
