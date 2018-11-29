const transferIndexScript = require(`./TransferIndex.js`);
const EventEmitter = require('events');
const readLine = require('readline');
const HttpsAgent = require('agentkeepalive');
const algolia = require('algoliasearch');

jest.mock('readline');
jest.mock('agentkeepalive');
jest.mock('algoliasearch');

// Mock Readline
readLine.cursorTo = jest.fn();
process.stdout.write = jest.fn();

// Mock Keepalive
HttpsAgent.HttpsAgent = jest.fn();

// Mock user input
const validProgram = {
  algoliaappid: 'fake-command-input-1',
  algoliaapikey: 'fake-command-input-2',
  algoliaindexname: 'fake-command-input-3',
  destinationalgoliaappid: 'fake-command-input-4',
  destinationalgoliaapikey: 'fake-command-input-5',
  destinationindexname: 'fake-command-input-6',
};

describe('Transfer Index script OK', () => {
  /* writeProgress */

  test('writeProgress should output number of records transferred', done => {
    const random = Math.floor(Math.random() * 10);
    transferIndexScript.writeProgress(random);
    expect(process.stdout.write).toBeCalledWith(
      `Records transferred: ~ ${random}`
    );
    done();
  });

  /* setIndices */

  test('setIndices should set algolia clients and indices', done => {
    const mockOptions = {
      sourceAppId: validProgram.algoliaappid,
      sourceApiKey: validProgram.algoliaapikey,
      indexName: validProgram.algoliaindexname,
      destinationAppId: validProgram.destinationalgoliaappid,
      destinationApiKey: validProgram.destinationalgoliaapikey,
      destinationIndexName: validProgram.destinationindexname,
    };
    // Mock Algolia
    const initIndex = jest.fn();
    const client = { initIndex };
    algolia.mockReturnValue(client);

    transferIndexScript.setIndices(mockOptions);
    expect(algolia).toBeCalledTimes(2);
    expect(algolia).nthCalledWith(
      1,
      mockOptions.sourceAppId,
      mockOptions.sourceApiKey,
      expect.any(Object)
    );
    expect(algolia).nthCalledWith(
      2,
      mockOptions.destinationAppId,
      mockOptions.destinationApiKey,
      expect.any(Object)
    );
    expect(initIndex).toBeCalledTimes(2);
    expect(initIndex).nthCalledWith(1, mockOptions.indexName);
    expect(initIndex).nthCalledWith(2, mockOptions.destinationIndexName);
    done();
  });

  /* transferIndexConfig */

  test('transferIndexConfig should set algolia clients and indices', async done => {
    // Mock configuration
    const settings = 'mock_settings';
    const synonyms = 'mock_synonyms';
    const rules = 'mock_rules';
    // Mock Algolia source index instance methods
    const getSettings = jest.fn(() => settings);
    const exportSynonyms = jest.fn(() => synonyms);
    const exportRules = jest.fn(() => rules);
    transferIndexScript.sourceIndex = {
      getSettings,
      exportSynonyms,
      exportRules,
    };

    // Mock Algolia destination index instance methods
    const setSettings = jest.fn();
    const batchSynonyms = jest.fn();
    const batchRules = jest.fn();
    transferIndexScript.destinationIndex = {
      setSettings,
      batchSynonyms,
      batchRules,
    };

    // Execute transfer
    await transferIndexScript.transferIndexConfig();
    expect(setSettings).toBeCalledWith(settings);
    expect(batchSynonyms).toBeCalledWith(synonyms, expect.any(Object));
    expect(batchRules).toBeCalledWith(rules, expect.any(Object));
    done();
  });

  /* start */

  test('Services should be called with valid params', done => {
    // Mock Algolia
    const on = jest.fn();
    const browseAll = jest.fn(() => ({ on }));
    const getSettings = jest.fn().mockResolvedValue('settings');
    const exportSynonyms = jest.fn().mockResolvedValue('synonyms');
    const exportRules = jest.fn().mockResolvedValue('rules');
    const setSettings = jest.fn();
    const batchSynonyms = jest.fn();
    const batchRules = jest.fn();
    const index = {
      browseAll,
      getSettings,
      exportSynonyms,
      exportRules,
      setSettings,
      batchSynonyms,
      batchRules,
    };
    const client = {
      initIndex: jest.fn().mockReturnValue(index),
    };
    algolia.mockReturnValue(client);

    // Execute method
    const result = transferIndexScript.start(validProgram);

    // Use timeout to defer execution of test assertions
    setTimeout(() => {
      expect(algolia).toBeCalledWith(
        validProgram.algoliaappid,
        validProgram.algoliaapikey,
        expect.any(Object)
      );
      expect(algolia).toBeCalledWith(
        validProgram.destinationalgoliaappid,
        validProgram.destinationalgoliaapikey,
        expect.any(Object)
      );
      expect(client.initIndex).toBeCalledWith(validProgram.algoliaindexname);
      expect(client.initIndex).toBeCalledWith(validProgram.algoliaindexname);
      expect(getSettings).toBeCalled();
      expect(exportSynonyms).toBeCalled();
      expect(exportRules).toBeCalled();
      expect(setSettings).toBeCalledWith('settings');
      expect(batchSynonyms).toBeCalledWith('synonyms', expect.any(Object));
      expect(batchRules).toBeCalledWith('rules', expect.any(Object));
      expect(on).toBeCalledWith('result', expect.any(Function));
      expect(on).toBeCalledWith('end', expect.any(Function));
      expect(on).toBeCalledWith('error', expect.any(Function));
      expect(result).toEqual(false);
      done();
    }, 0);
  });

  test('Browser should respond to data stream result event', done => {
    // Mock Algolia hits
    const mockResults = {
      hits: [{ name: 'fake-hit-1' }, { name: 'fake-hit-2' }],
    };
    // Mock browser event emitter
    const browser = new EventEmitter();
    const browseAll = jest.fn(() => browser);
    const addObjects = jest.fn().mockResolvedValue('Objects added');
    const getSettings = jest.fn().mockResolvedValue('settings');
    const exportSynonyms = jest.fn().mockResolvedValue('synonyms');
    const exportRules = jest.fn().mockResolvedValue('rules');
    const setSettings = jest.fn();
    const batchSynonyms = jest.fn();
    const batchRules = jest.fn();
    const index = {
      browseAll,
      addObjects,
      getSettings,
      exportSynonyms,
      exportRules,
      setSettings,
      batchSynonyms,
      batchRules,
    };
    const client = {
      initIndex: jest.fn().mockReturnValue(index),
    };
    algolia.mockReturnValue(client);
    // Mock writeProgress method
    transferIndexScript.writeProgress = jest.fn();

    // Execute method
    transferIndexScript.start(validProgram);
    // Test onResult event handler
    browser.emit('result', mockResults);

    // Use timeout to defer execution of test assertions
    setTimeout(() => {
      // Expect script to import data to destination Algolia index in onResult handler
      expect(addObjects).toBeCalledWith(expect.any(Array));
      // Expect script to output progress in onResult handler
      expect(transferIndexScript.writeProgress).toBeCalledWith(2);
      done();
    }, 0);
  });

  test('Browser should respond to data stream end event', done => {
    const consoleLogSpy = jest.spyOn(global.console, 'log');
    // Mock browser event emitter
    const browser = new EventEmitter();
    const browseAll = jest.fn(() => browser);
    const getSettings = jest.fn().mockResolvedValue('settings');
    const exportSynonyms = jest.fn().mockResolvedValue('synonyms');
    const exportRules = jest.fn().mockResolvedValue('rules');
    const setSettings = jest.fn();
    const batchSynonyms = jest.fn();
    const batchRules = jest.fn();
    const index = {
      browseAll,
      getSettings,
      exportSynonyms,
      exportRules,
      setSettings,
      batchSynonyms,
      batchRules,
    };
    const client = {
      initIndex: jest.fn().mockReturnValue(index),
    };
    algolia.mockReturnValue(client);
    // Mock writeProgress method
    transferIndexScript.writeProgress = jest.fn();

    // Execute method
    transferIndexScript.start(validProgram);
    // Test onResult event handler
    browser.emit('end');
    // Use hack to defer execution of test assertions
    setTimeout(() => {
      // Expect script to import data to destination Algolia index in onResult handler
      expect(consoleLogSpy).toBeCalledWith(expect.any(String));
      done();
    }, 0);
  });

  test('Browser should respond to data stream error event', done => {
    try {
      // Mock browser event emitter
      const browser = new EventEmitter();
      const browseAll = jest.fn(() => browser);
      const getSettings = jest.fn().mockResolvedValue('settings');
      const exportSynonyms = jest.fn().mockResolvedValue('synonyms');
      const exportRules = jest.fn().mockResolvedValue('rules');
      const setSettings = jest.fn();
      const batchSynonyms = jest.fn();
      const batchRules = jest.fn();
      const index = {
        browseAll,
        getSettings,
        exportSynonyms,
        exportRules,
        setSettings,
        batchSynonyms,
        batchRules,
      };
      const client = {
        initIndex: jest.fn().mockReturnValue(index),
      };
      algolia.mockReturnValue(client);
      // Mock writeProgress method
      transferIndexScript.writeProgress = jest.fn();

      // Execute method
      transferIndexScript.start(validProgram);
      // Test onResult event handler
      browser.emit('error', 'Right error');
      setTimeout(() => {
        throw new Error('Wrong error');
      }, 0);
    } catch (e) {
      // Use hack to defer execution of test assertions
      setTimeout(() => {
        // Expect script to import data to destination Algolia index in onResult handler
        expect(e).toEqual('Right error');
        done();
      }, 0);
    }
  });
});
