const transferIndexConfigScript = require(`./TransferIndexConfig.js`);
const algolia = require('algoliasearch');

jest.mock('algoliasearch');

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
  /* getIndices */

  test('getIndices should return algolia indices', done => {
    const mockOptions = {
      sourceAppId: validProgram.sourcealgoliaappid,
      sourceApiKey: validProgram.sourcealgoliaapikey,
      sourceindexName: validProgram.sourcealgoliaindexname,
      destinationAppId: validProgram.destinationalgoliaappid,
      destinationApiKey: validProgram.destinationalgoliaapikey,
      destinationIndexName: validProgram.destinationindexname,
    };
    // Mock Algolia
    const initIndex = jest.fn(str => str);
    const client = { initIndex };
    algolia.mockReturnValue(client);

    const result = transferIndexConfigScript.getIndices(mockOptions);
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
    const settings = { name: 'mock_settings', replicas: 'mock_replicas' };
    const settingsWithoutReplicas = { name: 'mock_settings' };
    const replicaSetting = { replicas: 'mock_replicas' };
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
    // Mock options
    const options = {
      excludeReplicas: true,
    };

    // Execute transfer
    await transferIndexConfigScript.transferIndexConfig(
      indices,
      config,
      options
    );
    expect(getSettings).toHaveBeenCalled();
    expect(exportSynonyms).toHaveBeenCalled();
    expect(exportRules).toHaveBeenCalled();
    expect(setSettings).toHaveBeenCalledWith(
      expect.objectContaining(settingsWithoutReplicas)
    );
    expect(setSettings).not.toHaveBeenCalledWith(
      expect.objectContaining(replicaSetting)
    );
    expect(batchSynonyms).toHaveBeenCalledWith(synonyms, expect.any(Object));
    expect(batchRules).toHaveBeenCalledWith(rules, expect.any(Object));
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
      expect(algolia).toHaveBeenCalledWith(
        validProgram.sourcealgoliaappid,
        validProgram.sourcealgoliaapikey
      );
      expect(algolia).toHaveBeenCalledWith(
        validProgram.destinationalgoliaappid,
        validProgram.destinationalgoliaapikey
      );
      expect(client.initIndex).toHaveBeenCalledWith(
        validProgram.sourcealgoliaindexname
      );
      expect(client.initIndex).toHaveBeenCalledWith(
        validProgram.sourcealgoliaindexname
      );
      expect(getSettings).toHaveBeenCalled();
      expect(exportSynonyms).toHaveBeenCalled();
      expect(exportRules).toHaveBeenCalled();
      expect(setSettings).toHaveBeenCalledWith('settings');
      expect(batchSynonyms).toHaveBeenCalledWith(
        'synonyms',
        expect.any(Object)
      );
      expect(batchRules).toHaveBeenCalledWith('rules', expect.any(Object));
      expect(result).toEqual(undefined);
      expect(global.console.log).toHaveBeenCalledWith(expect.any(String));
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
