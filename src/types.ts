/** Package specifier to include or exclude. If a package name or version is a string, it will be matched exactly */
export type PackageSpecifier = {
  name?: string | RegExp;
  version?: string | RegExp;
};

export type DynamicLoaderOptions = {
  /** Registry URL to fetch package content from. By default "https://registry.npmjs.org" */
  registry?: string;

  /** Which packages to include. If not provided, all packages will be included */
  include?: PackageSpecifier[];

  /** Which packages to exclude. Filters included packages */
  exclude?: PackageSpecifier[];
};


export type InMemoryDynamicLoaderOptions = DynamicLoaderOptions & {
  /** Maximum time to keep package content in memory if unused, 0 or false disables cleanup */
  ttl?: false | number;
};

export type PackageContent = {
  path: string,
  content: Uint8Array,
}[];
