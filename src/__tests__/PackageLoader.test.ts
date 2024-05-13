import { Worker } from 'node:worker_threads';
import { join } from 'node:path';
import { PackageLoader } from '../PackageLoader.js';
import { RestrictedPackageError } from '../RestrictedPackageError.js';

vi.mock('node:worker_threads', () => {
  return {
    Worker: vi.fn(),
  };
});

const WorkerMock = vi.mocked(Worker);

const packageContentStub = {
  name: 'example-package',
  version: '1.0.0',
  content: 'mock content',
};

describe('PackageLoader', () => {
  let packageLoader: PackageLoader;

  const mockWorkerMessage = () => {
    const mockWorkerOn = vi.fn((event, handler) => {
      if (event === 'message') {
        process.nextTick(() => handler(packageContentStub));
      }
    });
    WorkerMock.mockImplementation(() => ({
      on: mockWorkerOn,
    } as any));
  };

  const mockWorkerError = () => {
    const mockWorkerOn = vi.fn((event, handler) => {
      if (event === 'error') {
        process.nextTick(() => handler(new Error('Worker error')));
      }
    });
    WorkerMock.mockImplementation(() => ({
      on: mockWorkerOn,
    } as any));
  };

  it('throws an error if registry URL is invalid', () => {
    expect(() => new PackageLoader({ registry: 'invalid-url' })).toThrow('Invalid registry URL');
  });

  describe('fetchPackageContent', () => {
    beforeEach(() => {
      packageLoader = new PackageLoader({ registry: 'http://example-registry.com' });
      vi.clearAllMocks();
      mockWorkerMessage();
    });

    it('fetches package content with worker', async () => {
      const result = await packageLoader.fetchPackageContent('example-package', '1.0.0');
      const expectedPath = join(__dirname, '../loadPackageWorker.js');
      expect(result).toEqual(packageContentStub);
      expect(WorkerMock).toHaveBeenCalledWith(expectedPath, {
        workerData: 'http://example-registry.com/example-package/1.0.0',
      });
    });

    it('uses default registry URL if not provided', async () => {
      const defaultRegistryPackageLoader = new PackageLoader();
      await defaultRegistryPackageLoader.fetchPackageContent('example-package', '1.0.0');
      WorkerMock.mockImplementation(vi.fn());
      expect(WorkerMock).toHaveBeenCalledWith(expect.anything(), {
        workerData: 'https://registry.npmjs.org/example-package/1.0.0',
      });
    });

    it('handles worker error correctly', async () => {
      mockWorkerError();
      await expect(packageLoader.fetchPackageContent('example-package', '1.0.0'))
        .rejects
        .toThrow('Worker error');
    });
  });


  describe('package restrictions', () => {
    it.each([
      {
        params: { include: [{ name: 'foo' }] },
        pkgName: 'foo',
        pkgVersion: '1.0.0',
      },
      {
        params: { exclude: [{ name: 'foo' }] },
        pkgName: 'bar',
        pkgVersion: '1.0.0',
      },
      {
        params: { include: [{ name: /foo/ }], exclude: [{ name: 'foobar' }] },
        pkgName: 'foo',
        pkgVersion: '1.0.0',
      },
    ])('fetches $pkgName@$pkgVersion for options { include: $params.include, exclude: $params.exclude }', ({
      params,
      pkgName,
      pkgVersion,
    }) => {
      const dynamicLoader = new PackageLoader(params);
      mockWorkerMessage();
      expect(
        dynamicLoader.fetchPackageContent(pkgName, pkgVersion),
      ).resolves.not.toThrow(RestrictedPackageError);
    });

    it.each([
      {
        params: { include: [{ name: 'foo' }] },
        pkgName: 'bar',
        pkgVersion: '1.0.0',
      },
      {
        params: { exclude: [{ name: 'foo' }] },
        pkgName: 'foo',
        pkgVersion: '1.0.0',
      },
      {
        params: { include: [{ name: /foo/ }], exclude: [{ name: 'foobar' }] },
        pkgName: 'foobar',
        pkgVersion: '1.0.0',
      },
    ])('throws for $pkgName@$pkgVersion and options { include: $params.include, exclude: $params.exclude }', ({
      params,
      pkgName,
      pkgVersion,
    }) => {
      const dynamicLoader = new PackageLoader(params);
      expect(
        dynamicLoader.fetchPackageContent(pkgName, pkgVersion),
      ).rejects.toThrow(RestrictedPackageError);
    });
  });
});
