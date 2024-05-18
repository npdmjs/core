import { InMemoryDynamicLoader } from '../InMemoryDynamicLoader.js';
import { create as createMemFs } from 'mem-fs';
import { create as createMemFsEditor } from 'mem-fs-editor';
import { ExpirableMap } from '../ExpirableMap.js';
import { PackageLoader } from '../PackageLoader.js';

vi.mock('mem-fs', () => ({
  create: vi.fn(),
}));
vi.mock('mem-fs-editor', () => ({
  create: vi.fn(),
}));
vi.mock('../PackageLoader.js', () => {
  const PackageLoaderMock = class {};
  (PackageLoaderMock.prototype as any).fetchPackageContent = vi.fn();
  return { PackageLoader: PackageLoaderMock };
});

const fetchPackageContentMock = vi.mocked(PackageLoader.prototype.fetchPackageContent);


describe('InMemoryDynamicLoader', () => {
  const createMemFsMock = vi.mocked(createMemFs);
  const createMemFsEditorMock = vi.mocked(createMemFsEditor);
  const getStoredValueMock = vi.fn();
  const writeMock = vi.fn();
  const commitMock = vi.fn();

  let loader: InMemoryDynamicLoader;

  beforeEach(() => {
    createMemFsMock.mockReturnValue({
      get: getStoredValueMock,
    } as any);
    createMemFsEditorMock.mockReturnValue({
      write: writeMock,
      commit: commitMock,
    } as any);
    loader = new InMemoryDynamicLoader({ registry: 'http://test-registry.com', exclude: [{ name: 'restricted-pkg' }] });
    // fetchSpy = vi.spyOn(loader as any, 'fetchPackageContent');
  });


  afterEach(() => {
    vi.resetAllMocks();
  });


  it('loads package tarball and returns list of files', async () => {
    const fileContentStub = Buffer.from('console.log("Hello World!")');
    getStoredValueMock.mockReturnValue({
      contents: fileContentStub,
    });
    fetchPackageContentMock.mockResolvedValue([
      { path: 'index.js', content: fileContentStub },
    ]);

    const result = await loader.getAsset('ama', '1.0.0', 'index.js');

    expect(writeMock).toHaveBeenCalledWith('index.js', fileContentStub);
    expect(writeMock).toHaveBeenCalledTimes(1);
    expect(commitMock).not.toBeCalled();
    expect(result).toEqual(fileContentStub);
  });


  it('returns value if it is already in memory', async () => {
    const fileContentStub = Buffer.from('console.log("test#2")');
    fetchPackageContentMock.mockResolvedValue([
      { path: 'index.js', content: fileContentStub },
    ]);
    getStoredValueMock.mockReturnValue({
      contents: fileContentStub,
    });

    await loader.getAsset('ama', '1.0.0', 'index.js');
    const result = await loader.getAsset('ama', '1.0.0', 'index.js');

    expect(fetchPackageContentMock).toHaveBeenCalledTimes(1); // load once
    expect(getStoredValueMock).toHaveBeenCalledTimes(2); // return twice
    expect(result).toEqual(fileContentStub); // same result
  });


  it('awaits for a loader to finish if it is already in progress', async () => {
    const indexJsStub = Buffer.from('console.log("index.js")');
    const mainJsStub = Buffer.from('console.log("main.js")');
    fetchPackageContentMock.mockResolvedValue([
      { path: 'index.js', content: indexJsStub },
      { path: 'main.js', content: mainJsStub },
    ]);
    getStoredValueMock.mockImplementation((path: string) => {
      return { contents: path === 'index.js' ? indexJsStub : mainJsStub };
    });

    const firstPromise = loader.getAsset('ama', '1.0.0', 'index.js');
    const secondPromise = loader.getAsset('ama', '1.0.0', 'main.js');

    const results = await Promise.all([firstPromise, secondPromise]);

    expect(fetchPackageContentMock).toHaveBeenCalledTimes(1); // load once
    expect(getStoredValueMock).toHaveBeenCalledTimes(2); // return twice
    expect(results.includes(indexJsStub)).toBeTruthy();
    expect(results.includes(mainJsStub)).toBeTruthy();
  });

  it('throws an error if package is restricted', async () => {
    await expect(loader.getAsset('restricted-pkg', '1.0.0', 'index.js'))
      .rejects
      .toThrow();
  });

  it('uses ExpirableMap if TTL is provided', async () => {
    const contentsStub = Buffer.from('console.log("Hello World!")');
    const expirableMapHasSpy = vi.spyOn(ExpirableMap.prototype, 'has');
    const expirableMapGetSpy = vi.spyOn(ExpirableMap.prototype, 'get');
    expirableMapHasSpy.mockReturnValue(true);
    expirableMapGetSpy.mockReturnValue({
      get: vi.fn().mockReturnValue({
        contents: contentsStub,
      }),
    });
    const loader = new InMemoryDynamicLoader({ ttl: 1000 });
    const actualContent = await loader.getAsset('ama', '1.0.0', 'index.js');
    expect(actualContent).toBe(contentsStub);
  });
});
