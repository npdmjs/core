# Changelog

## [2.1.2](https://github.com/npdmjs/core/compare/v2.1.1...v2.1.2) (2024-05-18)


### Bug Fixes

* **packageloader:** resolve issue with __dirname variable in ES modules ([5f00ce9](https://github.com/npdmjs/core/commit/5f00ce9179c41e50fb79ae28f6b00530f197401a))

## [2.1.1](https://github.com/npdmjs/core/compare/v2.1.0...v2.1.1) (2024-05-18)


### Bug Fixes

* **inmemorydynamicloader:** disable writing files to the filesystem ([5343e8d](https://github.com/npdmjs/core/commit/5343e8deabdc7f34390f3315de34e6c26c4b2702))

## [2.1.0](https://github.com/npdmjs/core/compare/v2.0.0...v2.1.0) (2024-05-18)


### Features

* expose InMemoryDynamicLoaderOptions type ([11491ee](https://github.com/npdmjs/core/commit/11491eefd8db0f5421f5ae2d35debdbaa2f4955b))

## [2.0.0](https://github.com/npdmjs/core/compare/v1.0.1...v2.0.0) (2024-05-13)


### ⚠ BREAKING CHANGES

* DynamicLoader class is not available anymore, concrete PackageLoader should be used instead

### Features

* **dynamicloader:** add include and exclude options to manage allowed packages ([92d1719](https://github.com/npdmjs/core/commit/92d17194b60865db74c4414ebdb3ecf3806d3057))
* **inmemorydynamicloader:** add time-to-live (ttl) option for automatic memory cleanup ([31a353c](https://github.com/npdmjs/core/commit/31a353c0ea639b7e9f0bfe742dcfe591f9782851))


### Code Refactoring

* move package loading logic into a separate PackageLoader class ([1a60920](https://github.com/npdmjs/core/commit/1a6092069b9cf5959973fa158e8d4120ae05b964))

## [1.0.1](https://github.com/npdmjs/core/compare/v1.0.0...v1.0.1) (2024-04-17)


### Bug Fixes

* **abstractdynamicloader:** remove unnecessary excape symbols from the regular expression ([d14eae5](https://github.com/npdmjs/core/commit/d14eae5b371d917bd0fdf6d7d023a1cc2e2ae9cd))
* fix buffer types ([1b1d90f](https://github.com/npdmjs/core/commit/1b1d90f436305e60eec9d8adaab6d4231600b535))

## 1.0.0 (2024-04-02)


### Features

* add extensions to support ESM + vitest ([2194be1](https://github.com/npdmjs/core/commit/2194be143e9ff2769cea6c991dca5ab528b4926b))
* init commit ([d3cd1d2](https://github.com/npdmjs/core/commit/d3cd1d21da2732811e67c0280895865e597120cf))
