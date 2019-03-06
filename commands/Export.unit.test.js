const exportScript = require(`./Export.js`);
const EventEmitter = require('events');
const algolia = require('algoliasearch');
const fs = require('fs');
const path = require('path');

jest.mock('algoliasearch');
jest.mock('fs');
jest.mock('path');

// Mock fs
const isDirectory = jest.fn().mockReturnValue(true);
fs.lstatSync.mockReturnValue({ isDirectory });
fs.writeFileSync = jest.fn();

// Mock user input
const validProgram = {
  algoliaappid: 'fake-command-input-1',
  algoliaapikey: 'fake-command-input-2',
  algoliaindexname: 'fake-command-input-3',
  outputpath: 'fake-command-input-4',
};

describe('Export script OK', () => {
  /* writeFile */

  test('writeFile should call fs.writeFileSync', done => {
    const hits = [{ name: 'fake-hit-1' }, { name: 'fake-hit-2' }];
    const options = {
      appId: validProgram.algoliaappid,
      apiKey: validProgram.algoliaapikey,
      indexName: validProgram.algoliaindexname,
      outputPath: validProgram.outputpath,
      params: { hitsPerPage: 1000 },
    };
    const fileCount = 1;
    const filename = `algolia-index-${options.indexName}-${fileCount}.json`;
    fs.writeFileSync = jest.fn();
    path.resolve = jest.fn((str, str2) => `${str}/${str2}`);

    // Execute method
    exportScript.writeFile(hits, options, fileCount);
    // Expect fs.writeFileSync to be called with correct params
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      `${options.outputPath}/${filename}`,
      JSON.stringify(hits)
    );
    done();
  });

  /* exportData */

  test('Services should be called with valid params', async done => {
    // Mock config
    const options = {
      appId: validProgram.algoliaappid,
      apiKey: validProgram.algoliaapikey,
      indexName: validProgram.algoliaindexname,
      outputPath: validProgram.outputpath,
      params: { hitsPerPage: 1000 },
    };
    // Mock Algolia
    const browser = new EventEmitter();
    const browseAll = jest.fn(() => browser);
    const index = { browseAll };
    const initIndex = jest.fn().mockReturnValue(index);
    const client = { initIndex };
    algolia.mockReturnValueOnce(client);
    const browserSpy = jest.spyOn(browser, 'on');

    // Execute method
    const promise = exportScript.exportData(options);
    // Trigger promise resolution
    browser.emit('end');
    const result = await promise;
    // Assertions
    expect(algolia).toHaveBeenCalledWith(options.appId, options.apiKey);
    expect(client.initIndex).toHaveBeenCalledWith(options.indexName);
    expect(browseAll).toHaveBeenCalledWith('', options.params);
    expect(browserSpy).toHaveBeenCalledWith('result', expect.any(Function));
    expect(browserSpy).toHaveBeenCalledWith('end', expect.any(Function));
    expect(browserSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect(result).toEqual(expect.any(String));
    done();
  });

  test('Browser should respond to data stream result event', async done => {
    // Mock Algolia
    const mockResults = {
      hits: [{ name: 'fake-hit-1' }, { name: 'fake-hit-2' }],
    };
    // Mock 10000 hits to force conditional block
    mockResults.hits.length = 10000;
    // Mock browser event emitter
    const browser = new EventEmitter();
    const browseAll = jest.fn(() => browser);
    const index = { browseAll };
    const initIndex = jest.fn().mockReturnValue(index);
    const client = { initIndex };
    algolia.mockReturnValueOnce(client);
    // Mock instance method
    exportScript.writeProgress = jest.fn();
    exportScript.writeFile = jest.fn();
    // Execute method
    const promise = exportScript.exportData(validProgram);
    // Test onResult event handler
    browser.emit('result', mockResults);
    browser.emit('end');
    await promise;
    // Expect script to output progress in onResult handler
    expect(exportScript.writeProgress).toHaveBeenCalledWith(expect.any(String));
    // Expect script to write data to file in onResult handler
    expect(exportScript.writeFile).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.any(Number)
    );
    done();
  });

  test('Browser should respond to data stream end event', async done => {
    // Mock Algolia
    const mockResults = {
      hits: [{ name: 'fake-hit-1' }, { name: 'fake-hit-2' }],
    };
    // Mock browser event emitter
    const browser = new EventEmitter();
    const browseAll = jest.fn(() => browser);
    const index = { browseAll };
    const initIndex = jest.fn().mockReturnValue(index);
    const client = { initIndex };
    algolia.mockReturnValueOnce(client);
    // Mock instance method
    exportScript.writeProgress = jest.fn();
    exportScript.writeFile = jest.fn();
    // Execute method
    const promise = exportScript.exportData(validProgram);
    // Test onResult event handler
    browser.emit('result', mockResults);
    browser.emit('end');
    const result = await promise;
    // Expect script to write data to file in onEnd handler
    expect(exportScript.writeFile).toHaveBeenCalledWith(
      mockResults.hits,
      expect.any(Object),
      1
    );
    expect(result).toEqual(expect.any(String));
    done();
  });

  /* start */

  test('Should set options and export data', async done => {
    const logSpy = jest.spyOn(global.console, 'log');
    // Mock config
    const mockOptions = {
      appId: validProgram.algoliaappid,
      apiKey: validProgram.algoliaapikey,
      indexName: validProgram.algoliaindexname,
      outputPath: validProgram.outputpath,
      params: { hitsPerPage: 1000 },
    };
    exportScript.normalizePath = jest.fn(str => str);
    exportScript.exportData = jest.fn().mockResolvedValue('result');

    // Execute method
    await exportScript.start(validProgram);
    expect(exportScript.exportData).toHaveBeenCalledWith(mockOptions);
    expect(logSpy).toHaveBeenCalledWith('result');
    done();
  });
});
