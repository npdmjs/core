export class RestrictedPackageError extends Error {
  public constructor(packageName: string, version: string) {
    super(`The package "${packageName}@${version}" is restricted to load`);
  }
}
