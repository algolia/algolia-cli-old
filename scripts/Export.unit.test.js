const exportScript = require(`./Export.js`);
const EventEmitter = require('events');
const readLine = require('readline');
const HttpsAgent = require('agentkeepalive');
const algolia = require('algoliasearch');
const fs = require('fs');

jest.mock('readline');
jest.mock('agentkeepalive');
jest.mock('algoliasearch');
jest.mock('fs');

// Mock Readline
readLine.cursorTo = jest.fn();
process.stdout.write = jest.fn();

// Mock Keepalive
HttpsAgent.HttpsAgent = jest.fn();

// Mock fs
fs.writeFileSync = jest.fn();

// Mock user input
const validProgram = {
  algoliaappid: 'fake-command-input-1',
  algoliaapikey: 'fake-command-input-2',
  algoliaindexname: 'fake-command-input-3',
  outputfilepath: 'fake-command-input-4',
};

describe('Export script OK', () => {
  /* writeProgress */

  test('writeProgress should output number of records browsed', done => {
    const random = Math.floor(Math.random() * 10);
    exportScript.writeProgress(random);
    expect(process.stdout.write).toBeCalledWith(`Records browsed: ~ ${random}`);
    done();
  });

  /* start */

  test('Services should be called with valid params', done => {
    // Mock Algolia
    const on = jest.fn();
    const browseAll = jest.fn(() => ({ on }));
    const index = { browseAll };
    const client = {
      initIndex: jest.fn().mockReturnValue(index),
    };
    algolia.mockReturnValueOnce(client);
    const result = exportScript.start(validProgram);
    expect(algolia).toBeCalledWith(
      validProgram.algoliaappid,
      validProgram.algoliaapikey,
      expect.any(Object)
    );
    expect(client.initIndex).toBeCalledWith(validProgram.algoliaindexname);
    expect(on).toBeCalledWith('result', expect.any(Function));
    expect(on).toBeCalledWith('end', expect.any(Function));
    expect(on).toBeCalledWith('error', expect.any(Function));
    expect(result).toEqual(false);
    done();
  });

  test('Browser should respond to data stream result event', done => {
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
    const client = {
      initIndex: jest.fn().mockReturnValue(index),
    };
    algolia.mockReturnValueOnce(client);
    // Mock writeProgress method
    exportScript.writeProgress = jest.fn();
    // Execute method
    exportScript.start(validProgram);
    // Test onResult event handler
    browser.emit('result', mockResults);
    // Expect script to output progress in onResult handler
    expect(exportScript.writeProgress).toBeCalledWith(expect.any(Number));
    // Expect script to write data to file in onResult handler
    expect(fs.writeFileSync).toBeCalledWith(
      expect.any(String),
      expect.any(String),
      'utf8',
      expect.any(Function)
    );
    done();
  });

  test('Browser should respond to data stream end event', done => {
    // Mock Algolia
    const mockResults = {
      hits: [{ name: 'fake-hit-1' }, { name: 'fake-hit-2' }],
    };
    // Mock browser event emitter
    const browser = new EventEmitter();
    const browseAll = jest.fn(() => browser);
    const index = { browseAll };
    const client = {
      initIndex: jest.fn().mockReturnValue(index),
    };
    algolia.mockReturnValueOnce(client);
    // Mock writeProgress method
    exportScript.writeProgress = jest.fn();
    // Execute method
    exportScript.start(validProgram);
    // Test onResult event handler
    browser.emit('result', mockResults);
    // Test onEnd event handler
    browser.emit('end');
    // Expect script to output progress in onResult handler
    expect(exportScript.writeProgress).toBeCalledWith(2);
    // Expect script to write remaining data in onEnd handler
    expect(fs.writeFileSync).toBeCalledWith(
      expect.any(String),
      JSON.stringify(mockResults.hits),
      'utf8',
      expect.any(Function)
    );
    done();
  });
});
