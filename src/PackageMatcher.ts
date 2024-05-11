import type { PackageSpecifier } from './types.js';

export class PackageMatcher {
  public getIsMatched(pkgName: string, pkgVersion: string, specifiers: PackageSpecifier[]): boolean {
    for (const { name, version } of specifiers) {
      const isNameMatched = pkgName === name || (name instanceof RegExp && name.test(pkgName));
      const isVersionMatched = version === pkgVersion || (version instanceof RegExp && version.test(pkgVersion));

      if (isNameMatched
        && isVersionMatched
        || (isNameMatched && !version)
        || (!name && isVersionMatched)
      ) {
        return true;
      }
    }

    return false;
  }
}
