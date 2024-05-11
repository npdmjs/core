import { Worker } from 'node:worker_threads';
import { join } from 'node:path';
import { AbstractDynamicLoader } from '../AbstractDynamicLoader.js';

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


class DynamicLoaderTest extends AbstractDynamicLoader {
  public async getAsset(): Promise<Buffer | null> {
    return null;
  }
  public async runFetch(packageName: string, version: string) {
    return this.fetchPackageContent(packageName, version);
  }
  public runIsAllowed(packageName: string, version: string) {
    return this.getIsPackageAllowed(packageName, version);
  }
}


describe('AbstractDynamicLoader', () => {
  let dynamicLoader: DynamicLoaderTest;

  it('throws an error if registry URL is invalid', () => {
    expect(() => new DynamicLoaderTest({ registry: 'invalid-url' })).toThrow('Invalid registry URL');
  });

  describe('fetchPackageContent', () => {
    beforeEach(() => {
      dynamicLoader = new DynamicLoaderTest({ registry: 'http://example-registry.com' });
      vi.clearAllMocks();
      const mockWorkerOn = vi.fn((event, handler) => {
        if (event === 'message') {
          process.nextTick(() => handler(packageContentStub));
        }
      });
      WorkerMock.mockImplementation(() => ({
        on: mockWorkerOn,
      } as any));
    });


    it('fetches package content with worker', async () => {
      const result = await dynamicLoader.runFetch('example-package', '1.0.0');
      const expectedPath = join(__dirname, '../loadPackageWorker.js');
      expect(result).toEqual(packageContentStub);
      expect(WorkerMock).toHaveBeenCalledWith(expectedPath, {
        workerData: 'http://example-registry.com/example-package/1.0.0',
      });
    });

    it('uses default registry URL if not provided', async () => {
      const defaultRegistryDynamicLoader = new DynamicLoaderTest();
      await defaultRegistryDynamicLoader.runFetch('example-package', '1.0.0');
      WorkerMock.mockImplementation(vi.fn());
      expect(WorkerMock).toHaveBeenCalledWith(expect.anything(), {
        workerData: 'https://registry.npmjs.org/example-package/1.0.0',
      });
    });

    it('handles worker error correctly', async () => {
      const mockWorkerOn = vi.fn((event, handler) => {
        if (event === 'error') {
          process.nextTick(() => handler(new Error('Worker error')));
        }
      });
      WorkerMock.mockImplementation(() => ({
        on: mockWorkerOn,
      } as any));
      await expect(dynamicLoader.runFetch('example-package', '1.0.0'))
        .rejects
        .toThrow('Worker error');
    });
  });


  describe('getIsPackageAllowed', () => {
    it.each([
      {
        params: { include: [{ name: 'foo' }] },
        pkgName: 'foo',
        pkgVersion: '1.0.0',
        isExpectedAllowed: true,
      },
      {
        params: { include: [{ name: 'foo' }] },
        pkgName: 'bar',
        pkgVersion: '1.0.0',
        isExpectedAllowed: false,
      },
      {
        params: { exclude: [{ name: 'foo' }] },
        pkgName: 'foo',
        pkgVersion: '1.0.0',
        isExpectedAllowed: false,
      },
      {
        params: { exclude: [{ name: 'foo' }] },
        pkgName: 'bar',
        pkgVersion: '1.0.0',
        isExpectedAllowed: true,
      },
      {
        params: { include: [{ name: /foo/ }], exclude: [{ name: 'foobar' }] },
        pkgName: 'foo',
        pkgVersion: '1.0.0',
        isExpectedAllowed: true,
      },
      {
        params: { include: [{ name: /foo/ }], exclude: [{ name: 'foobar' }] },
        pkgName: 'foobar',
        pkgVersion: '1.0.0',
        isExpectedAllowed: false,
      },
    ])('$pkgName@$pkgVersion is $isExpectedAllowed for { include: $params.include, exclude: $params.exclude }', ({
      params,
      pkgName,
      pkgVersion,
      isExpectedAllowed,
    }) => {
      const dynamicLoader = new DynamicLoaderTest(params);
      const isAllowed = dynamicLoader.runIsAllowed(pkgName, pkgVersion);
      expect(isAllowed).toBe(isExpectedAllowed);
    });
  });
});
