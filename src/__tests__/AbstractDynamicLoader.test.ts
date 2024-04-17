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
}


describe('AbstractDynamicLoader', () => {
  let dynamicLoader: DynamicLoaderTest;

  beforeEach(() => {
    dynamicLoader = new DynamicLoaderTest('http://example-registry.com');
    vi.clearAllMocks();
  });

  it('fetchPackageContent should fetch package content', async () => {
    const mockWorkerOn = vi.fn((event, handler) => {
      if (event === 'message') {
        process.nextTick(() => handler(packageContentStub));
      }
    });

    WorkerMock.mockImplementation(() => ({
      on: mockWorkerOn,
    } as any));

    const result = await dynamicLoader.runFetch('example-package', '1.0.0');

    expect(result).toEqual(packageContentStub);
    const expectedPath = join(__dirname, '../loadPackageWorker.js');
    expect(Worker).toHaveBeenCalledWith(expectedPath, {
      workerData: 'http://example-registry.com/example-package/1.0.0',
    });
  });


  it('fetchPackageContent should handle worker error correctly', async () => {
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

  it('throws an error if registry URL is invalid', () => {
    expect(() => new DynamicLoaderTest('invalid-url')).toThrow('Invalid registry URL');
  });
});
