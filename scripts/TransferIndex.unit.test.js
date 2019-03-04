const transferIndexScript = require(`./TransferIndex.js`);
const EventEmitter = require('events');
const readLine = require('readline');
const algolia = require('algoliasearch');

jest.mock('readline');
jest.mock('algoliasearch');

// Mock Readline
readLine.cursorTo = jest.fn();
process.stdout.write = jest.fn();

// Mock user input
const validProgram = {
  sourcealgoliaappid: 'fake-command-input-1',
  sourcealgoliaapikey: 'fake-command-input-2',
  sourcealgoliaindexname: 'fake-command-input-3',
  destinationalgoliaappid: 'fake-command-input-4',
  destinationalgoliaapikey: 'fake-command-input-5',
  destinationindexname: 'fake-command-input-6',
};

describe('Transfer Index script OK', () => {
  /* writeProgress */

  test('writeProgress should output number of records transferred', done => {
    const random = Math.floor(Math.random() * 10);
    transferIndexScript.writeProgress(random);
    expect(process.stdout.write).toHaveBeenCalledWith(
      `Records transferred: ~ ${random}`
    );
    done();
  });

  /* getIndices */

  test('getIndices should set algolia clients and indices', done => {
    const mockOptions = {
      sourceAppId: validProgram.sourcealgoliaappid,
      sourceApiKey: validProgram.sourcealgoliaapikey,
      sourceIndexName: validProgram.sourcealgoliaindexname,
      destinationAppId: validProgram.destinationalgoliaappid,
      destinationApiKey: validProgram.destinationalgoliaapikey,
      destinationIndexName: validProgram.destinationindexname,
    };
    // Mock Algolia
    const initIndex = jest.fn(str => str);
    const client = { initIndex };
    algolia.mockReturnValue(client);

    const result = transferIndexScript.getIndices(mockOptions);
    expect(algolia).toHaveBeenCalledTimes(2);
    expect(algolia).toHaveBeenNthCalledWith(
      1,
      mockOptions.sourceAppId,
      mockOptions.sourceApiKey
    );
    expect(algolia).toHaveBeenNthCalledWith(
      2,
      mockOptions.destinationAppId,
      mockOptions.destinationApiKey
    );
    expect(initIndex).toHaveBeenCalledTimes(2);
    expect(initIndex).toHaveBeenNthCalledWith(1, mockOptions.sourceIndexName);
    expect(initIndex).toHaveBeenNthCalledWith(
      2,
      mockOptions.destinationIndexName
    );
    expect(result).toEqual({
      sourceIndex: mockOptions.sourceIndexName,
      destinationIndex: mockOptions.destinationIndexName,
    });
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
    // Mock Algolia destination index instance methods
    const setSettings = jest.fn();
    const batchSynonyms = jest.fn();
    const batchRules = jest.fn();
    // Mock indices
    const indices = {
      sourceIndex: {
        getSettings,
        exportSynonyms,
        exportRules,
      },
      destinationIndex: {
        setSettings,
        batchSynonyms,
        batchRules,
      },
    };

    // Execute transfer
    await transferIndexScript.transferIndexConfig(indices);
    expect(getSettings).toHaveBeenCalled();
    expect(exportSynonyms).toHaveBeenCalled();
    expect(exportRules).toHaveBeenCalled();
    expect(setSettings).toHaveBeenCalledWith(settings);
    expect(batchSynonyms).toHaveBeenCalledWith(synonyms);
    expect(batchRules).toHaveBeenCalledWith(rules);
    done();
  });

  /* transferData */

  test('Browser should respond to data stream result event', async done => {
    // Mock Algolia hits
    const mockResults = {
      hits: [{ name: 'fake-hit-1' }, { name: 'fake-hit-2' }],
    };
    // Mock browser event emitter
    const browser = new EventEmitter();
    const browseAll = jest.fn(() => browser);
    const addObjects = jest.fn().mockResolvedValue('Objects added');
    const index = {
      browseAll,
      addObjects,
    };
    const indices = {
      sourceIndex: Object.assign({}, index),
      destinationIndex: Object.assign({}, index),
    };
    // Mock writeProgress method
    transferIndexScript.writeProgress = jest.fn();

    // Execute method
    const promise = transferIndexScript.transferData(indices, null);
    // Test onResult event handler
    browser.emit('result', mockResults);
    browser.emit('end');
    // Resolve/reject
    await promise;
    // Expect script to import data to destination Algolia index in onResult handler
    expect(addObjects).toHaveBeenCalledWith(expect.any(Array));
    // Expect script to output progress in onResult handler
    expect(transferIndexScript.writeProgress).toHaveBeenCalledWith(2);
    done();
  });

  test('Browser should respond to data stream end event', async done => {
    // Mock browser event emitter
    const browser = new EventEmitter();
    const browseAll = jest.fn(() => browser);
    const index = {
      browseAll,
    };
    const indices = {
      sourceIndex: Object.assign({}, index),
      destinationIndex: Object.assign({}, index),
    };

    // Execute method
    const promise = transferIndexScript.transferData(indices, null);
    // Test onEnd event handler
    browser.emit('end');
    // Resolve/reject
    const result = await promise;
    // Expect console output
    expect(result).toEqual(expect.any(String));
    done();
  });

  test('Browser should respond to data stream error event', async done => {
    try {
      // Mock browser event emitter
      const browser = new EventEmitter();
      const browseAll = jest.fn(() => browser);
      const index = {
        browseAll,
      };
      const indices = {
        sourceIndex: Object.assign({}, index),
        destinationIndex: Object.assign({}, index),
      };

      // Execute method
      const promise = transferIndexScript.transferData(indices, null);
      // Test onError event handler
      browser.emit('error', 'Right error');
      // Resolve/reject
      await promise;
      // Set a final error that should never be reached
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

  /* start */

  test('Services should be called with valid params', async done => {
    const logSpy = jest.spyOn(global.console, 'log');
    // Mock options
    const options = {
      sourceAppId: validProgram.sourcealgoliaappid,
      sourceApiKey: validProgram.sourcealgoliaapikey,
      sourceIndexName: validProgram.sourcealgoliaindexname,
      destinationAppId: validProgram.destinationalgoliaappid,
      destinationApiKey: validProgram.destinationalgoliaapikey,
      destinationIndexName: validProgram.destinationindexname,
      transformations: null,
    };
    // Mock instance methods
    transferIndexScript.getIndices = jest.fn(() => 'indices');
    transferIndexScript.getTransformations = jest.fn(() => 'transformations');
    transferIndexScript.transferIndexConfig = jest
      .fn()
      .mockResolvedValue('settings set');
    transferIndexScript.transferData = jest.fn().mockResolvedValue('result');
    // Execute method
    const result = await transferIndexScript.start(validProgram);
    expect(transferIndexScript.getIndices).toHaveBeenCalledWith(options);
    expect(transferIndexScript.getTransformations).toHaveBeenCalledWith(
      options
    );
    expect(transferIndexScript.transferIndexConfig).toHaveBeenCalled();
    expect(transferIndexScript.transferData).toHaveBeenCalledWith(
      'indices',
      'transformations'
    );
    expect(logSpy).toHaveBeenCalledWith('result');
    expect(result).toEqual(undefined);
    done();
  });
});
