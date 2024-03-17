import { InMemoryDynamicLoader } from '../InMemoryDynamicLoader';
import { create as createMemFs } from 'mem-fs';
import { create as createMemFsEditor } from 'mem-fs-editor';

jest.mock('mem-fs', () => ({
  create: jest.fn(),
}));
jest.mock('mem-fs-editor', () => ({
  create: jest.fn(),
}));
jest.mock('../DynamicLoader', () => ({
  DynamicLoader: class {
    public fetchPackageContent = jest.fn();
  },
}));


describe('InMemoryDynamicLoader', () => {
  const createMemFsMock = jest.mocked(createMemFs);
  const createMemFsEditorMock = jest.mocked(createMemFsEditor);
  const getStoredValueMock = jest.fn();
  const writeMock = jest.fn();
  const commitMock = jest.fn();

  let loader: InMemoryDynamicLoader;
  let fetchSpy: jest.SpyInstance;


  beforeEach(() => {
    createMemFsMock.mockReturnValue({
      get: getStoredValueMock,
    } as any);
    createMemFsEditorMock.mockReturnValue({
      write: writeMock,
      commit: commitMock,
    } as any);
    loader = new InMemoryDynamicLoader('REGISTRY_TEST');
    fetchSpy = jest.spyOn(loader as any, 'fetchPackageContent');
  });


  afterEach(() => {
    jest.resetAllMocks();
  });


  it('loads package tarball and returns list of files', async () => {
    const fileContentStub = Buffer.from('console.log("Hello World!")');
    getStoredValueMock.mockReturnValue({
      contents: fileContentStub,
    });
    fetchSpy.mockResolvedValue([
      { path: 'index.js', content: fileContentStub },
    ]);

    const result = await loader.getAsset('ama', '1.0.0', 'index.js');

    expect(writeMock).toHaveBeenCalledWith('index.js', fileContentStub);
    expect(writeMock).toHaveBeenCalledTimes(1);
    expect(commitMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fileContentStub);
  });


  it ('returns value if it is already in memory', async () => {
    const fileContentStub = Buffer.from('console.log("test#2")');
    fetchSpy.mockResolvedValue([
      { path: 'index.js', content: fileContentStub },
    ]);
    getStoredValueMock.mockReturnValue({
      contents: fileContentStub,
    });

    await loader.getAsset('ama', '1.0.0', 'index.js');
    const result = await loader.getAsset('ama', '1.0.0', 'index.js');

    expect(fetchSpy).toHaveBeenCalledTimes(1); // load once
    expect(getStoredValueMock).toHaveBeenCalledTimes(2); // return twice
    expect(result).toEqual(fileContentStub); // same result
  });


  it ('awaits for a loader to finish if it is already in progress', async () => {
    const indexJsStub = Buffer.from('console.log("index.js")');
    const mainJsStub = Buffer.from('console.log("main.js")');
    fetchSpy.mockResolvedValue([
      { path: 'index.js', content: indexJsStub },
      { path: 'main.js', content: mainJsStub },
    ]);
    getStoredValueMock.mockImplementation((path: string) => {
      return { contents: path === 'index.js' ? indexJsStub : mainJsStub };
    });

    const firstPromise = loader.getAsset('ama', '1.0.0', 'index.js');
    const secondPromise = loader.getAsset('ama', '1.0.0', 'main.js');

    const results = await Promise.all([firstPromise, secondPromise]);

    expect(fetchSpy).toHaveBeenCalledTimes(1); // load once
    expect(getStoredValueMock).toHaveBeenCalledTimes(2); // return twice
    expect(results.includes(indexJsStub)).toBeTruthy();
    expect(results.includes(mainJsStub)).toBeTruthy();
  });
});