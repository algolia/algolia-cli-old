const importScript = require(`./Import.js`);
const HttpsAgent = require('agentkeepalive');
const algolia = require('algoliasearch');
const readLine = require('readline');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const transform = require('stream-transform');
const csv = require('csvtojson');

jest.mock('agentkeepalive');
jest.mock('algoliasearch');
jest.mock('readline');
jest.mock('fs');
jest.mock('stream-transform');
jest.mock('csvtojson');

// Mock fs
const isDirectory = jest.fn().mockReturnValueOnce(false);
const isFile = jest.fn().mockReturnValue(true);
fs.lstatSync.mockReturnValue({ isDirectory, isFile });

// Mock Readline
readLine.clearLine = jest.fn();
readLine.cursorTo = jest.fn();
process.stdout.write = jest.fn();

// Mock Keepalive
HttpsAgent.HttpsAgent = jest.fn();

// Mock Algolia
const initIndex = jest.fn();
const client = { initIndex };
algolia.mockReturnValue(client);

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

  /* writeProgress */

  test('Should write progress with correct count to stdout', done => {
    const count = 908765;
    importScript.writeProgress(count);
    expect(readLine.clearLine).toHaveBeenCalled();
    expect(readLine.cursorTo).toHaveBeenCalled();
    expect(process.stdout.write).toHaveBeenCalledWith(
      `Records indexed: ${count}`
    );
    done();
  });

  /* setIndex */

  test('Should set Algolia index instance variable', done => {
    const options = {
      appId: validProgram.algoliaappid,
      apiKey: validProgram.algoliaapikey,
      indexName: validProgram.algoliaindexname,
      keepaliveAgent: { name: 'keepaliveAgent' },
    };
    importScript.setIndex(options);
    expect(algolia).toHaveBeenCalledWith(
      validProgram.algoliaappid,
      validProgram.algoliaapikey,
      expect.any(Object)
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
    expect(transform).toHaveBeenCalledWith(importScript.defaultTransformations);
    done();
  });

  test('Should return correct writestream for CSV filetype', done => {
    importScript.conditionallyParseCsv(true);
    expect(csv).toHaveBeenCalled();
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

  test('Should kick off script when called with valid params', done => {
    const directory =
      '/Users/username/Documents/Code/practice/path-manipulation';
    const filename = 'test.js';
    const filepath = `${directory}/${filename}`;
    validProgram.sourcefilepath = filepath;
    importScript.indexFiles = jest.fn();
    importScript.start(validProgram);
    expect(importScript.indexFiles).toHaveBeenCalledWith([filename]);
    done();
  });
});
