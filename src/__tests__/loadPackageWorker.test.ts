import { parentPort } from 'node:worker_threads';
import type { PackageContent } from '../PackageContent';
import { tarballArrayBufferStub } from './packageStub';

jest.mock('node:worker_threads', () => ({
  parentPort: {
    postMessage: jest.fn(),
  },
  isMainThread: false,
  workerData: 'https://registry.npmjs.org/ama/1.0.0',
}));

global.fetch = jest.fn();
const postMessageMock = jest.mocked(parentPort?.postMessage);
const fetchMock = jest.mocked(global.fetch);

describe('loadPackageWorker', () => {
  it('loads package tarball and returns list of files', async () => {
    const packageDetailsResponse = new Response(JSON.stringify({
      dist: {
        tarball: 'https://registry.npmjs.org/ama/-/ama-1.0.0.tgz',
      },
    }));

    fetchMock.mockResolvedValueOnce(packageDetailsResponse);
    fetchMock.mockResolvedValueOnce(new Response(tarballArrayBufferStub));

    await import('../loadPackageWorker');

    let packageContent: PackageContent = [];

    // waiting until the worker sends a message
    await new Promise<void>(resolve => {
      postMessageMock?.mockImplementation((data) => {
        packageContent = data;
        resolve();
      });
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith('https://registry.npmjs.org/ama/1.0.0');
    expect(fetchMock).toHaveBeenCalledWith('https://registry.npmjs.org/ama/-/ama-1.0.0.tgz');

    expect(Array.isArray(packageContent)).toBe(true);
    expect(packageContent.length).toBe(3);
    expect(packageContent.some(({ path }) => path === 'package.json')).toBe(true);
  });
});