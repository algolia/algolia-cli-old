const addRulesScript = require(`./AddRules.js`);
const HttpsAgent = require('agentkeepalive');
const algolia = require('algoliasearch');
const path = require('path');
const fs = require('fs');

const rulesPath = path.resolve(
  process.cwd(),
  'tests/mocks/addRules/rules.json'
);

jest.mock('agentkeepalive');
jest.mock('algoliasearch');

// Mock Keepalive
HttpsAgent.HttpsAgent = jest.fn();

// Mock Algolia
const message = 'Caught exception';
const batchRules = jest.fn();
const index = { batchRules };
const client = {
  initIndex: jest.fn(),
};
algolia.mockReturnValue(client);

// Mock user input
const validProgram = {
  algoliaappid: 'fake-command-input-1',
  algoliaapikey: 'fake-command-input-2',
  algoliaindexname: 'fake-command-input-3',
  sourcefilepath: rulesPath,
};

describe('AddRules script OK', () => {
  /* start */

  test('batchRules should be called with valid params', async done => {
    const options = { forwardToReplicas: false, clearExistingRules: false };
    const rulesFile = await fs.readFileSync(rulesPath);
    const rules = JSON.parse(rulesFile);
    client.initIndex.mockReturnValueOnce(index);
    await addRulesScript.start(validProgram);
    expect(algolia).toHaveBeenCalledWith(
      validProgram.algoliaappid,
      validProgram.algoliaapikey,
      expect.any(Object)
    );
    expect(client.initIndex).toHaveBeenCalledWith(
      validProgram.algoliaindexname
    );
    expect(index.batchRules).toHaveBeenCalledWith(rules, options);
    done();
  });

  test('AddRules catches exceptions', async done => {
    try {
      // Mock error during execution
      client.initIndex.mockImplementation(() => {
        throw new Error(message);
      });
      // Execute method
      await addRulesScript.start(validProgram);
      throw new Error('This error should not be reached');
    } catch (e) {
      expect(e.message).toEqual(message);
      done();
    }
  });
});
