const importScript = require(`./Import.js`);
const algolia = require('algoliasearch');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const transform = require('stream-transform'); // eslint-disable-line no-unused-vars
const async = require('async');
const through = require('through');
const csv = require('csvtojson');

jest.mock('algoliasearch');
jest.mock('fs');
jest.mock('stream-transform');
jest.mock('async');
jest.mock('through');
jest.mock('csvtojson');

// Mock fs
const isDirectory = jest.fn().mockReturnValueOnce(false);
const isFile = jest.fn().mockReturnValue(true);
fs.lstatSync.mockReturnValue({ isDirectory, isFile });

// Mock Algolia
const initIndex = jest.fn();
const client = { initIndex };
algolia.mockReturnValue(client);

// Mock async
async.queue = jest.fn();

// Mock user input
const validProgram = {
  sourcefilepath: 'fake-command-input-1',
  algoliaappid: 'fake-command-input-2',
  algoliaapikey: 'fake-command-input-3',
  algoliaindexname: 'fake-command-input-4',
};

describe('Import script OK', () => {
  /* defaultTransformations */

  test('Should perform default transformation', done => {
    const testData = { name: 'test' };
    const testCallback = jest.fn();
    importScript.defaultTransformations(testData, testCallback);
    expect(testCallback).toHaveBeenCalledWith(null, testData);
    done();
  });

  /* suggestions */

  test('Should return helpful message', done => {
    const batchSize = 5000;
    const maxConcurrency = 2;
    importScript.batchSize = batchSize;
    importScript.maxConcurrency = maxConcurrency;
    const result = importScript.suggestions();
    expect(result).toEqual(expect.any(String));
    expect(result.includes(batchSize)).toBe(true);
    expect(result.includes(maxConcurrency)).toBe(true);
    done();
  });

  /* checkMemoryUsage */

  test('Should attempt to handle high memory usage', done => {
    jest.useFakeTimers();
    const handleHighMemoryUsageSpy = jest.spyOn(
      importScript,
      'handleHighMemoryUsage'
    );
    const handleExtremeMemoryUsageSpy = jest.spyOn(
      importScript,
      'handleExtremeMemoryUsage'
    );
    const usedMb = 800;
    const percentUsed = 78;
    importScript.highMemoryUsage = false;
    importScript.getMemoryUsage = jest.fn().mockReturnValue({
      usedMb,
      percentUsed,
    });
    importScript.checkMemoryUsage();
    expect(handleHighMemoryUsageSpy).toHaveBeenCalledWith(percentUsed);
    expect(handleExtremeMemoryUsageSpy).not.toHaveBeenCalled();
    jest.runAllTimers();
    done();
  });

  test('Should attempt to handle very high memory usage', done => {
    jest.useFakeTimers();
    const handleHighMemoryUsageSpy = jest.spyOn(
      importScript,
      'handleHighMemoryUsage'
    );
    const handleExtremeMemoryUsageSpy = jest.spyOn(
      importScript,
      'handleExtremeMemoryUsage'
    );
    const usedMb = 1000;
    const percentUsed = 98;
    importScript.highMemoryUsage = false;
    importScript.getMemoryUsage = jest.fn().mockReturnValue({
      usedMb,
      percentUsed,
    });
    importScript.checkMemoryUsage();
    expect(handleHighMemoryUsageSpy).toHaveBeenCalledWith(percentUsed);
    expect(handleExtremeMemoryUsageSpy).toHaveBeenCalledWith(
      usedMb,
      percentUsed
    );
    jest.runAllTimers();
    done();
  });

  /* handleHighMemoryUsage */

  test('Should update batchSize on high memory usage', done => {
    jest.useFakeTimers();
    const updateBatchSizeSpy = jest.spyOn(importScript, 'updateBatchSize');
    const percentUsed = 75;
    const expected = 5000;
    importScript.batchSize = 10000;
    importScript.handleHighMemoryUsage(percentUsed);
    expect(updateBatchSizeSpy).toHaveBeenCalledWith(expected);
    expect(importScript.batchSize).toEqual(expected);
    jest.runAllTimers();
    done();
  });

  /* handleExtremeMemoryUsage */

  test('Should issue warning when extremely high memory usage', done => {
    jest.useFakeTimers();
    const logSpy = jest.spyOn(global.console, 'log');
    const usedMb = 1000;
    const percentUsed = 98;
    importScript.highMemoryUsage = false;
    importScript.handleExtremeMemoryUsage(usedMb, percentUsed);
    expect(importScript.highMemoryUsage).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String)
    );
    jest.runAllTimers();
    done();
  });

  /* setIndex */

  test('Should set Algolia index instance variable', done => {
    const options = {
      appId: validProgram.algoliaappid,
      apiKey: validProgram.algoliaapikey,
      indexName: validProgram.algoliaindexname,
    };
    importScript.setIndex(options);
    expect(algolia).toHaveBeenCalledWith(
      validProgram.algoliaappid,
      validProgram.algoliaapikey
    );
    expect(importScript.client.initIndex).toHaveBeenCalledWith(
      validProgram.algoliaindexname
    );
    done();
  });

  /* setTransformations */

  test('Should apply correct formatRecord method without transformations input param', done => {
    const options = {
      transformations: null,
    };
    importScript.setTransformations(options);
    expect(importScript.formatRecord).toEqual(
      importScript.defaultTransformations
    );
    done();
  });

  test('Should apply correct formatRecord method with transformations input param', done => {
    const transformations = path.resolve(
      process.cwd(),
      'tests/mocks/users-transformation.js'
    );
    const method = require(transformations);
    const options = { transformations };
    importScript.setTransformations(options);
    expect(importScript.formatRecord).toEqual(method);
    done();
  });

  /* conditionallyParseCsv */

  test('Should return correct writestream for JSON filetype', done => {
    importScript.conditionallyParseCsv(false);
    expect(through).toHaveBeenCalled();
    done();
  });

  test('Should return correct writestream for CSV filetype', done => {
    importScript.conditionallyParseCsv(true);
    expect(csv).toHaveBeenCalled();
    done();
  });

  /* setBatchSize */

  test('Should set this.batchSize and this.batch', async done => {
    const options = { objectsPerBatch: null };
    importScript.batchSize = null;
    importScript.minBatchSize = 100;
    importScript.desiredBatchSizeMb = 10;
    importScript.estimateBatchSize = jest.fn().mockResolvedValue(3000);
    importScript.getNetworkSpeed = jest.fn().mockResolvedValue(1);
    await importScript.setBatchSize(options);
    expect(importScript.batchSize).toEqual(300);
    done();
  });

  /* estimateBatchSize */

  /* updateBatchSize */

  test('Should update this.batchSize and this.batch', done => {
    const newSize = 100;
    importScript.batchSize = 2500;
    importScript.updateBatchSize(100);
    expect(importScript.batchSize).toEqual(newSize);
    done();
  });

  /* importToAlgolia */

  test('Should call addObjects to import data to Algolia', async done => {
    importScript.index = {
      addObjects: jest.fn(),
    };
    const data = {
      name: 'fake-object',
      objectID: '90876578',
    };
    const callback = jest.fn();
    await importScript.importToAlgolia(data, callback);
    expect(importScript.index.addObjects).toHaveBeenCalledWith(data);
    done();
  });

  /* retryImport */

  /* indexFiles */

  test('Should exit method early if no more filenames in input array', done => {
    const result = importScript.indexFiles([]);
    expect(fs.createReadStream).not.toHaveBeenCalled();
    expect(result).toEqual(undefined);
    done();
  });

  test('Should open file read stream, pipe transformed contents into batches, and index in Algolia', done => {
    // Spy on method we are testing because it is recursive
    const indexFilesSpy = jest.spyOn(importScript, 'indexFiles');
    // Mock filestream
    let eventCount = 0;
    const mockedStream = new Readable({
      objectMode: false,
      read() {
        eventCount++;
        if (eventCount < 11) return this.push(`event-${eventCount}`);
        else return this.push(null);
      },
    });
    mockedStream.pause = jest.fn();
    mockedStream.resume = jest.fn();
    mockedStream.pipe = jest.fn(() => mockedStream);
    fs.createReadStream.mockReturnValueOnce(mockedStream);

    // Mocked instance methods
    const directory =
      '/Users/username/Documents/Code/practice/path-manipulation';
    const filename = 'test.js';
    importScript.queue = {
      drain: jest.fn(),
      push: jest.fn(),
      length: jest.fn(() => 9),
    };
    importScript.formatRecord = jest.fn();
    importScript.directory = directory;
    importScript.filename = filename;
    importScript.maxConcurrency = 4;
    importScript.batchSize = 10;

    // Run target method to test
    importScript.indexFiles([filename]);
    // Test onData event handler
    mockedStream.emit('data', 'data');
    // Test onEnd event handler
    mockedStream.emit('end', 'end');
    // Test onDrain event handler
    importScript.queue.drain();

    // Expect creation of read stream with correct params
    expect(fs.createReadStream).toHaveBeenCalledWith(
      `${directory}/${filename}`,
      {
        autoclose: true,
        flags: 'r',
      }
    );
    // Expect filstream to pause when queue is full in onData handler
    expect(mockedStream.pause).toHaveBeenCalled();
    // Expect indexFiles to be called recursively in onEnd handler
    expect(indexFilesSpy).toHaveBeenCalledWith([]);
    // Expect filstream to resume when queue is empty in onDrain handler
    expect(mockedStream.resume).toHaveBeenCalled();
    done();
  });

  /* start */

  test('Should kick off script when called with valid params', async done => {
    const directory =
      '/Users/username/Documents/Code/practice/path-manipulation';
    const filename = 'test.js';
    const filepath = `${directory}/${filename}`;
    validProgram.sourcefilepath = filepath;
    importScript.indexFiles = jest.fn();
    importScript.setBatchSize = jest.fn();
    await importScript.start(validProgram);
    expect(importScript.indexFiles).toHaveBeenCalledWith([filename]);
    done();
  });
});
