import { Store, create as createMemFs } from 'mem-fs';
import { create as createMemFsEditor } from 'mem-fs-editor';
import { DynamicLoader } from './DynamicLoader';
import { PackageContent } from '.';

export class InMemoryDynamicLoader extends DynamicLoader {
  private readonly storage = new Map<string, Store>();
  private readonly loaders = new Map<string, Promise<PackageContent>>();

  public async getAsset(packageName: string, version: string, assetPath: string): Promise<Buffer | null> {
    const key = `${packageName}@${version}`;

    if (this.storage.has(key)) {
      return this.storage.get(key)?.get(assetPath).contents as Buffer | null;
    }

    if (this.loaders.has(key)) {
      await this.loaders.get(key);
    } else {
      const storage: Store = createMemFs();
      const fsEditor = createMemFsEditor(storage);
      const loader = this.fetchPackageContent(packageName, version);
      this.loaders.set(key, loader);

      const packageContent = await loader;

      packageContent.forEach(
        ({ path, content }) => fsEditor.write(path, content),
      );

      fsEditor.commit();
      this.storage.set(key, storage);
      this.loaders.delete(key);
    }

    return this.storage.get(key)?.get(assetPath).contents as Buffer | null;
  }
}