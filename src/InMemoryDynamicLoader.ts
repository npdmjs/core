import { Store, create as createMemFs } from 'mem-fs';
import { create as createMemFsEditor } from 'mem-fs-editor';
import { AbstractDynamicLoader } from './AbstractDynamicLoader.js';
import { RestrictedPackageError } from './RestrictedPackageError.js';
import type { InMemoryDynamicLoaderOptions, PackageContent } from './types.js';
import { ExpirableMap } from './ExpirableMap.js';

/**
 * Option 1. External class which saves information about potentially created stores - bad,
 * because it looks into the implementation details of the class
 *
 * Option 2. Add store self-expire implementation. Each package will have its own TTL (and timeout) CONVENIENT, but
 * we cannot control the cleanup process from inside the store
 */

export class InMemoryDynamicLoader extends AbstractDynamicLoader {
  private readonly storage: Map<string, Store>;
  private readonly loaders = new Map<string, Promise<PackageContent>>();

  constructor(options: InMemoryDynamicLoaderOptions = {}) {
    super(options);
    if (options.ttl) {
      this.storage = new ExpirableMap<string, Store>(options.ttl);
    } else {
      this.storage = new Map();
    }
  }

  public async getAsset(packageName: string, version: string, assetPath: string): Promise<Buffer | null> {
    if (!this.getIsPackageAllowed(packageName, version)) {
      throw new RestrictedPackageError(packageName, version);
    }

    const key = `${packageName}@${version}`;

    if (this.storage.has(key)) {
      return this.storage.get(key)?.get(assetPath).contents as Buffer | null;
    }

    if (this.loaders.has(key)) {
      // for the case if there was another request and we are already fetching the package content
      const loader = this.loaders.get(key);
      await loader;
    } else {
      // we need to fetch the package content
      const storage: Store = createMemFs();
      const fsEditor = createMemFsEditor(storage);
      const loader = this.fetchPackageContent(packageName, version);
      this.loaders.set(key, loader);

      const packageContent = await loader;

      packageContent.forEach(
        ({ path, content }) => fsEditor.write(path, Buffer.from(content)),
      );

      fsEditor.commit();
      this.storage.set(key, storage);
      this.loaders.delete(key);
    }

    return this.storage.get(key)?.get(assetPath).contents as Buffer | null;
  }
}
