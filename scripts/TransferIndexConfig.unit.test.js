const transferIndexConfigScript = require(`./TransferIndexConfig.js`);
const HttpsAgent = require('agentkeepalive');
const algolia = require('algoliasearch');

jest.mock('agentkeepalive');
jest.mock('algoliasearch');

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
  /* getIndices */

  test('getIndices should return algolia indices', done => {
    const mockOptions = {
      sourceAppId: validProgram.algoliaappid,
      sourceApiKey: validProgram.algoliaapikey,
      sourceindexName: validProgram.algoliaindexname,
      destinationAppId: validProgram.destinationalgoliaappid,
      destinationApiKey: validProgram.destinationalgoliaapikey,
      destinationIndexName: validProgram.destinationindexname,
    };
    // Mock Algolia
    const initIndex = jest.fn(str => str);
    const client = { initIndex };
    algolia.mockReturnValue(client);

    const result = transferIndexConfigScript.getIndices(mockOptions);
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
    expect(initIndex).nthCalledWith(1, mockOptions.sourceIndexName);
    expect(initIndex).nthCalledWith(2, mockOptions.destinationIndexName);
    expect(result).toEqual({
      sourceIndex: mockOptions.sourceIndexName,
      destinationIndex: mockOptions.destinationIndexName,
    });
    done();
  });

  /* getConfigOptions */

  test('getConfigOptions should return default config if no config params provided', done => {
    const mockOptions = {
      configParams: undefined,
    };
    const result = transferIndexConfigScript.getConfigOptions(mockOptions);
    expect(result).toEqual({
      sOptions: expect.any(Object),
      rOptions: expect.any(Object),
    });
    done();
  });

  test('getConfigOptions should return correct config when provided valid params', done => {
    const configParams = {
      batchSynonymsParams: {
        forwardToReplicas: true,
        replaceExistingSynonyms: true,
      },
      batchRulesParams: {
        forwardToReplicas: true,
        clearExistingRules: true,
      },
    };
    const mockOptions = {
      configParams: JSON.stringify(configParams),
    };
    const result = transferIndexConfigScript.getConfigOptions(mockOptions);
    expect(result).toEqual({
      sOptions: configParams.batchSynonymsParams,
      rOptions: configParams.batchRulesParams,
    });
    done();
  });

  /* transferIndexConfig */

  test('transferIndexConfig should set algolia clients and indices', async done => {
    // Mock Data
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
    // Mock config
    const config = {
      sOptions: {},
      rOptions: {},
    };

    // Execute transfer
    await transferIndexConfigScript.transferIndexConfig(indices, config);
    expect(getSettings).toBeCalled();
    expect(exportSynonyms).toBeCalled();
    expect(exportRules).toBeCalled();
    expect(setSettings).toBeCalledWith(settings);
    expect(batchSynonyms).toBeCalledWith(synonyms, expect.any(Object));
    expect(batchRules).toBeCalledWith(rules, expect.any(Object));
    done();
  });

  /* start */

  test('Services should be called with valid params', async done => {
    global.console.log = jest.fn();

    // Mock Algolia
    const getSettings = jest.fn().mockResolvedValue('settings');
    const exportSynonyms = jest.fn().mockResolvedValue('synonyms');
    const exportRules = jest.fn().mockResolvedValue('rules');
    const setSettings = jest.fn();
    const batchSynonyms = jest.fn();
    const batchRules = jest.fn();
    const index = {
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
    const result = await transferIndexConfigScript.start(validProgram);

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
      expect(result).toEqual(undefined);
      expect(global.console.log).toBeCalledWith(expect.any(String));
      done();
    }, 0);
  });

  test('Transfer Index Config catches exceptions', async done => {
    const message = 'fgctry6y7u8ioj';
    try {
      // Mock error during execution
      transferIndexConfigScript.validate = jest.fn(() => {
        throw new Error(message);
      });
      // Execute method
      await transferIndexConfigScript.start(validProgram);
      throw new Error('This error should not be reached');
    } catch (e) {
      expect(e.message).toEqual(message);
      done();
    }
  });
});
